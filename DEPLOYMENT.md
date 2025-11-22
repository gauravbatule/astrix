# Astrix Deployment Guide

## 🚀 Quick Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd astrix
   vercel
   ```

4. **Set Environment Variables**
   
   In your Vercel dashboard or via CLI:
   ```bash
   vercel env add GROQ_API_KEY
   ```
   
   Then paste your Groq API key when prompted.

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Push to GitHub** (see GitHub setup below)

2. **Visit [vercel.com/new](https://vercel.com/new)**

3. **Import your GitHub repository**

4. **Configure Environment Variables**
   - Add `GROQ_API_KEY` in the Environment Variables section
   - Optionally add:
     - `GROQ_PRIMARY_MODEL=openai/gpt-oss-120b`
     - `GROQ_FALLBACK_MODEL=llama-3.3-70b-versatile`

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live!

## 📦 GitHub Setup

### Create a New Repository on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Name your repository (e.g., "astrix-astrology")
3. Choose visibility (Public or Private)
4. **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

### Push Your Code

```bash
# If you haven't initialized git yet
git init
git add .
git commit -m "Initial commit: Astrix - Divine Vedic Astrology AI"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

## 🔑 Environment Variables

Required environment variable:
- `GROQ_API_KEY`: Your Groq API key ([Get one here](https://console.groq.com))

Optional environment variables:
- `GROQ_PRIMARY_MODEL`: Primary AI model (default: `openai/gpt-oss-120b`)
- `GROQ_FALLBACK_MODEL`: Fallback AI model (default: `llama-3.3-70b-versatile`)

## 🔍 Troubleshooting

### Vercel Build Fails

**Error: Python version mismatch**
- Solution: Vercel uses Python 3.9 by default. Add `runtime.txt` with `python-3.12`

**Error: Module not found**
- Solution: Ensure all dependencies are in `requirements.txt`
- Try deploying again after updating

### API Errors

**Error: 403 Forbidden**
- Check if your `GROQ_API_KEY` is correctly set
- Verify the key is valid and has not expired

**Error: 500 Internal Server Error**
- Check Vercel function logs
- Ensure all environment variables are set
- Verify the Groq API is operational

### Voice Features Not Working

**Microphone permission denied**
- Grant microphone access in your browser settings
- Use HTTPS (required for mic access)
- Vercel provides HTTPS by default

## 📊 Monitoring

### Vercel Analytics

Enable Vercel Analytics to monitor your app:
1. Go to your project in Vercel dashboard
2. Navigate to "Analytics" tab
3. Enable Web Analytics

### Logging

View serverless function logs in Vercel:
1. Go to your project
2. Click on "Functions" tab
3. View real-time logs

## 🔧 Post-Deployment Configuration

### Custom Domain

1. Go to Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### Performance Optimization

- Vercel automatically handles:
  - Edge caching
  - Serverless function optimization
  - Static asset CDN delivery
  - Automatic HTTPS

## 📱 Testing Your Deployment

1. **Visit your deployed URL**
   - Format: `https://your-project-name.vercel.app`

2. **Test core features:**
   - Create a birth chart
   - Send a text message
   - Send a voice message
   - Check conversation memory
   - Verify chart visualization

3. **Monitor the first few requests**
   - Cold start might take 2-3 seconds
   - Subsequent requests will be faster

## 🎯 Next Steps

1. Star the GitHub repository ⭐
2. Set up automatic deployments (Vercel does this by default)
3. Share your deployment with users
4. Monitor analytics and logs
5. Consider adding:
   - Custom domain
   - User authentication
   - Data persistence (database)
   - Advanced analytics

## 💡 Tips

- Vercel automatically deploys on every `git push` to main
- Use `vercel dev` for local development that mimics production
- Preview deployments are created for every pull request
- Environment variables can be different per environment (Development/Preview/Production)

---

**Need help?** Open an issue on GitHub or check [Vercel Documentation](https://vercel.com/docs)
