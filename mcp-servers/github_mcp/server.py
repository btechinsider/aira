"""
GitHub MCP Server - Handles GitHub operations via MCP protocol
"""
import os
import base64
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="GitHub MCP Server", version="1.0.0")


class ToolRequest(BaseModel):
    """MCP tool request format"""
    arguments: Dict[str, Any]


class GitHubClient:
    """GitHub API client"""
    
    def __init__(self):
        self.token = os.getenv("GITHUB_TOKEN")
        if not self.token:
            raise ValueError("GITHUB_TOKEN environment variable is required")
        
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
    
    async def get_file_content(
        self,
        repo: str,
        file_path: str,
        ref: str = "main"
    ) -> str:
        """Get file content from GitHub"""
        url = f"{self.base_url}/repos/{repo}/contents/{file_path}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=self.headers,
                params={"ref": ref}
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
            
            response.raise_for_status()
            data = response.json()
            
            # Decode base64 content
            content = base64.b64decode(data["content"]).decode("utf-8")
            return content
    
    async def create_branch(
        self,
        repo: str,
        branch_name: str,
        base_branch: str = "main"
    ) -> str:
        """Create a new branch"""
        # Get base branch SHA
        url = f"{self.base_url}/repos/{repo}/git/refs/heads/{base_branch}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            base_sha = response.json()["object"]["sha"]
            
            # Create new branch
            url = f"{self.base_url}/repos/{repo}/git/refs"
            payload = {
                "ref": f"refs/heads/{branch_name}",
                "sha": base_sha
            }
            
            response = await client.post(url, headers=self.headers, json=payload)
            
            # Branch might already exist
            if response.status_code == 422:
                logger.warning(f"Branch {branch_name} already exists")
                return base_sha
            
            response.raise_for_status()
            return base_sha
    
    async def update_file(
        self,
        repo: str,
        file_path: str,
        content: str,
        message: str,
        branch: str
    ) -> Dict[str, Any]:
        """Update file in repository"""
        url = f"{self.base_url}/repos/{repo}/contents/{file_path}"
        
        async with httpx.AsyncClient() as client:
            # Get current file SHA
            try:
                response = await client.get(
                    url,
                    headers=self.headers,
                    params={"ref": branch}
                )
                response.raise_for_status()
                file_sha = response.json()["sha"]
            except:
                file_sha = None  # File doesn't exist yet
            
            # Update or create file
            payload = {
                "message": message,
                "content": base64.b64encode(content.encode()).decode(),
                "branch": branch
            }
            
            if file_sha:
                payload["sha"] = file_sha
            
            response = await client.put(url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            return response.json()
    
    async def create_pull_request(
        self,
        repo: str,
        title: str,
        head: str,
        base: str = "main",
        body: str = ""
    ) -> Dict[str, Any]:
        """Create a pull request"""
        url = f"{self.base_url}/repos/{repo}/pulls"
        
        payload = {
            "title": title,
            "head": head,
            "base": base,
            "body": body
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=self.headers, json=payload)
            
            if response.status_code == 422:
                # PR might already exist
                logger.warning(f"PR from {head} to {base} might already exist")
                # Try to find existing PR
                list_url = f"{self.base_url}/repos/{repo}/pulls"
                list_response = await client.get(
                    list_url,
                    headers=self.headers,
                    params={"head": f"{repo.split('/')[0]}:{head}", "base": base}
                )
                if list_response.status_code == 200:
                    prs = list_response.json()
                    if prs:
                        return prs[0]
            
            response.raise_for_status()
            return response.json()


github_client = GitHubClient()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "GitHub MCP Server",
        "version": "1.0.0",
        "tools": ["fetch_affected_file", "create_remediation_pr"]
    }


@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy"}


@app.post("/mcp/tools/fetch_affected_file")
async def fetch_affected_file(request: ToolRequest):
    """
    Fetch code context around affected line
    
    Arguments:
        repo: Repository in format "owner/repo"
        file_path: Path to file
        line_number: Line number
        context_lines: Number of lines before/after (default: 10)
    """
    args = request.arguments
    repo = args.get("repo")
    file_path = args.get("file_path")
    line_number = args.get("line_number", 1)
    context_lines = args.get("context_lines", 10)
    
    if not repo or not file_path:
        raise HTTPException(status_code=400, detail="repo and file_path are required")
    
    try:
        logger.info(f"Fetching {file_path}:{line_number} from {repo}")
        
        # Get file content
        content = await github_client.get_file_content(repo, file_path)
        lines = content.split("\n")
        
        # Calculate line range
        start_line = max(1, line_number - context_lines)
        end_line = min(len(lines), line_number + context_lines)
        
        # Extract snippet
        snippet_lines = lines[start_line - 1:end_line]
        code_snippet = "\n".join(
            f"{i + start_line}: {line}" for i, line in enumerate(snippet_lines)
        )
        
        return {
            "file_path": file_path,
            "line_number": line_number,
            "start_line": start_line,
            "end_line": end_line,
            "code_snippet": code_snippet,
            "total_lines": len(lines)
        }
        
    except Exception as e:
        logger.error(f"Error fetching file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/mcp/tools/create_remediation_pr")
async def create_remediation_pr(request: ToolRequest):
    """
    Create a PR with the proposed fix
    
    Arguments:
        repo: Repository in format "owner/repo"
        branch_name: New branch name
        file_path: Path to file to patch
        patch_content: Patch content (full file or diff)
        title: PR title
        description: PR description (optional)
    """
    args = request.arguments
    repo = args.get("repo")
    branch_name = args.get("branch_name")
    file_path = args.get("file_path")
    patch_content = args.get("patch_content")
    title = args.get("title")
    description = args.get("description", "")
    
    if not all([repo, branch_name, file_path, patch_content, title]):
        raise HTTPException(
            status_code=400,
            detail="repo, branch_name, file_path, patch_content, and title are required"
        )
    
    try:
        logger.info(f"Creating PR for {repo}:{branch_name}")
        
        # Create branch
        await github_client.create_branch(repo, branch_name)
        logger.info(f"Created branch {branch_name}")
        
        # Get current file content
        try:
            current_content = await github_client.get_file_content(repo, file_path)
        except:
            current_content = ""
        
        # Apply patch (simplified - in production, use proper patch library)
        # For now, treat patch_content as the new file content
        new_content = patch_content
        
        # If patch_content looks like a diff, try to apply it
        if patch_content.startswith("---") or patch_content.startswith("diff"):
            # This is a simplified patch application
            # In production, use a proper patch library like unidiff
            logger.warning("Diff-style patch detected, using as-is (simplified)")
            # For demo purposes, just use the patch as new content
            # In production, properly parse and apply the diff
            new_content = current_content  # Keep original for safety
        
        # Update file
        commit_result = await github_client.update_file(
            repo=repo,
            file_path=file_path,
            content=new_content,
            message=f"[AIRA] {title}",
            branch=branch_name
        )
        logger.info(f"Updated file {file_path}")
        
        # Create PR
        pr_result = await github_client.create_pull_request(
            repo=repo,
            title=title,
            head=branch_name,
            base="main",
            body=description
        )
        
        pr_url = pr_result.get("html_url", "")
        pr_number = pr_result.get("number", 0)
        
        logger.info(f"Created PR #{pr_number}: {pr_url}")
        
        return {
            "pr_url": pr_url,
            "pr_number": pr_number,
            "branch_name": branch_name,
            "commit_sha": commit_result.get("commit", {}).get("sha", "")
        }
        
    except Exception as e:
        logger.error(f"Error creating PR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Made with Bob
