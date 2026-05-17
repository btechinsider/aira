# AIRA Frontend Deployment Guide - Vercel

This guide walks you through deploying the AIRA frontend to Vercel.

## Prerequisites

- GitHub account with your AIRA repository
- Vercel account (sign up at https://vercel.com)
- Backend API already deployed (Render, Railway, or other)

## Step 1: Prepare Your Frontend

### 1.1 Create Vercel Configuration

Create a `vercel.json` file in your project root:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "installCommand": "cd frontend && npm install"
}
```

### 1.2 Verify package.json

Your `frontend/package.json` should have these scripts (already configured):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "Add New..." → "Project"

2. **Import Your Repository**
   - Select "Import Git Repository"
   - Choose your AIRA repository from GitHub
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset**: Select "Vite"
   - **Root Directory**: Click "Edit" and set to `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   
   ```
   VITE_BACKEND_URL=https://your-backend-url.onrender.com
   VITE_WS_URL=wss://your-backend-url.onrender.com
   ```
   
   Replace with your actual backend URL from Render.

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Your frontend will be live at `https://your-project.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Frontend Directory**
   ```bash
   cd frontend
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N`
   - Project name? `aira-frontend`
   - In which directory is your code located? `./`
   - Want to override settings? `Y`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Development Command: `npm run dev`

5. **Set Environment Variables**
   ```bash
   vercel env add VITE_BACKEND_URL
   # Enter: https://your-backend-url.onrender.com
   
   vercel env add VITE_WS_URL
   # Enter: wss://your-backend-url.onrender.com
   ```

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Step 3: Configure Backend CORS

Update your backend to allow requests from Vercel:

1. **Edit backend/main.py** - Add your Vercel URL to CORS origins:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "http://localhost:5173",
           "https://your-project.vercel.app",  # Add this
           os.getenv("FRONTEND_URL", "")
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Redeploy your backend** on Render

## Step 4: Verify Deployment

1. **Visit your Vercel URL**: `https://your-project.vercel.app`
2. **Check browser console** for any errors
3. **Test login/registration** functionality
4. **Verify WebSocket connection** in the dashboard

## Troubleshooting

### Build Fails with "react-scripts not found"
- **Cause**: Wrong build command
- **Fix**: Ensure build command is `npm run build` (not `react-scripts build`)

### API Requests Fail (CORS Error)
- **Cause**: Backend not configured for Vercel domain
- **Fix**: Add Vercel URL to backend CORS origins (see Step 3)

### Environment Variables Not Working
- **Cause**: Variables not prefixed with `VITE_`
- **Fix**: All frontend env vars must start with `VITE_`

### WebSocket Connection Fails
- **Cause**: Wrong WebSocket URL
- **Fix**: Use `wss://` (not `ws://`) for production backend

### Build Succeeds but Page is Blank
- **Cause**: Wrong output directory
- **Fix**: Ensure output directory is set to `dist`

## Continuous Deployment

Vercel automatically redeploys when you push to your main branch:

1. **Make changes** to your frontend code
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Update frontend"
   git push origin main
   ```
3. **Vercel automatically builds and deploys** (check dashboard for status)

## Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Wait for SSL certificate provisioning (automatic)

## Performance Optimization

Vercel automatically provides:
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Gzip/Brotli compression
- ✅ Image optimization
- ✅ Edge caching

## Monitoring

- **View Logs**: Vercel Dashboard → Your Project → Deployments → Click deployment → "View Function Logs"
- **Analytics**: Enable Vercel Analytics in project settings
- **Performance**: Check Web Vitals in Vercel Dashboard

## Cost

- **Free Tier**: 100GB bandwidth, unlimited deployments
- **Pro Tier**: $20/month for team features and more bandwidth

## Next Steps

1. ✅ Frontend deployed on Vercel
2. 🔄 Deploy backend on Render (if not done)
3. 🔄 Configure environment variables
4. 🔄 Test end-to-end functionality
5. 🔄 Set up custom domain (optional)

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- AIRA Issues: https://github.com/your-repo/issues