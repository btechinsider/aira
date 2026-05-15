# Contributing to AIRA

Thank you for your interest in contributing to AIRA (Autonomous Incident Response Agent)! This document provides guidelines for contributing to the project.

## 🚀 Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker and Docker Compose
- Git

### Setup Steps

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/aira.git
   cd aira
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your credentials
   ```

4. **Start development environment**
   ```bash
   make build
   make up
   ```

## 📝 Making Changes

### Code Style

**Python (Backend)**
- Follow PEP 8 style guide
- Use type hints where possible
- Maximum line length: 127 characters
- Use meaningful variable names

**TypeScript/React (Frontend)**
- Follow ESLint configuration
- Use functional components with hooks
- Use TypeScript for type safety

### Testing

Before submitting changes:

```bash
# Run backend tests
cd backend
pytest -v

# Run frontend build
cd frontend
npm run build

# Test Docker build
make build
```

### Documentation

- Update README.md if adding new features
- Add docstrings to Python functions
- Update API documentation for new endpoints
- Include comments for complex logic

## 🔄 Submitting Changes

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Maintenance tasks
- `perf:` Performance improvements

**Examples:**
```bash
git commit -m "feat(agent): add confidence scoring for remediation"
git commit -m "fix(mcp): handle GitHub API rate limiting"
git commit -m "docs: update installation instructions"
```

### Pull Request Process

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template

4. **PR Requirements**
   - Clear description of changes
   - Link to related issues
   - All CI checks must pass
   - At least one approval required
   - No merge conflicts

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

## 🐛 Reporting Bugs

### Before Submitting

1. Check existing issues
2. Verify it's reproducible
3. Test on latest version

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., Ubuntu 22.04]
- Docker version: [e.g., 24.0.0]
- AIRA version: [e.g., 1.0.0]

**Additional context**
Any other relevant information
```

## 💡 Feature Requests

We welcome feature suggestions! Please:

1. Check if it's already requested
2. Describe the use case
3. Explain expected behavior
4. Consider implementation approach

## 🔍 Code Review Process

### For Contributors

- Respond to feedback promptly
- Make requested changes
- Keep discussions professional
- Be open to suggestions

### For Reviewers

- Be constructive and respectful
- Focus on code, not the person
- Explain reasoning for changes
- Approve when ready

## 📚 Development Guidelines

### Backend (FastAPI)

```python
# Good: Type hints and docstrings
async def process_incident(incident: IncidentModel) -> Dict[str, Any]:
    """
    Process an incident through the agent workflow.
    
    Args:
        incident: The incident model to process
        
    Returns:
        Dictionary containing processing results
    """
    pass

# Bad: No types or documentation
async def process_incident(incident):
    pass
```

### Frontend (React)

```typescript
// Good: Typed props and clear component
interface IncidentCardProps {
  incident: Incident;
  onUpdate: (id: string) => void;
}

const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onUpdate }) => {
  // Component logic
};

// Bad: Untyped and unclear
const IncidentCard = (props) => {
  // Component logic
};
```

### MCP Servers

- Follow MCP protocol specifications
- Handle errors gracefully
- Log important operations
- Include health check endpoints

## 🏗️ Project Structure

```
aira/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── mcp-servers/      # MCP server implementations
├── docker/           # Docker configurations
├── .bob/             # Bob AI configuration
└── docs/             # Additional documentation
```

## 🤝 Community

- Be respectful and inclusive
- Help others learn
- Share knowledge
- Celebrate contributions

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

- Open an issue for questions
- Start a discussion on GitHub Discussions
- Check existing documentation

---

**Thank you for contributing to AIRA!** 🎉

Every contribution, no matter how small, helps make AIRA better for everyone.