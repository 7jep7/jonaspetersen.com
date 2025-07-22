# Deployment Guide

## Deploying to Vercel from GitHub

This guide will help you deploy your portfolio website to Vercel and have it accessible at jonaspetersen.com.

### 1. Push to GitHub

Since I can't perform Git operations directly, please follow these steps in your terminal:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Add all files to Git
git add .

# Commit the changes
git commit -m "Complete portfolio website with React frontend and Express backend"

# Add your GitHub repository as origin (replace with your actual repo URL)
git remote add origin https://github.com/7jep7/jonaspetersen.com.git

# Push to GitHub (this will overwrite your existing Remix site)
git push -u origin main --force
```

### 2. Configure Vercel

1. **Connect GitHub Repository**:
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Import Project"
   - Select your `jonaspetersen.com` repository

2. **Configure Build Settings**:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

3. **Add Environment Variables**:
   In Vercel dashboard → Settings → Environment Variables:
   ```
   DATABASE_URL=your_neon_database_connection_string
   NODE_ENV=production
   ```

4. **Custom Domain**:
   - In Vercel dashboard → Settings → Domains
   - Add `jonaspetersen.com` and `www.jonaspetersen.com`
   - Update your domain's DNS settings to point to Vercel

### 3. Database Setup

If you need a PostgreSQL database:

1. **Create Neon Account**: Go to [neon.tech](https://neon.tech)
2. **Create Database**: Create a new PostgreSQL database
3. **Get Connection String**: Copy the connection string from Neon dashboard
4. **Add to Vercel**: Add `DATABASE_URL` environment variable in Vercel
5. **Push Schema**: Run `npm run db:push` locally to set up tables

### 4. Verify Deployment

After deployment:
1. Visit your Vercel deployment URL
2. Check that all pages load correctly
3. Test any interactive features
4. Monitor Vercel logs for any errors

### 5. Automatic Deployments

Once configured, Vercel will automatically:
- Deploy on every push to the main branch
- Run build commands and tests
- Update your live site within minutes

### Troubleshooting

**Build Failures**:
- Check Vercel build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

**Database Issues**:
- Confirm `DATABASE_URL` is accessible from Vercel
- Check database connection limits
- Run `db:push` if schema changes don't reflect

**Domain Issues**:
- Verify DNS settings point to Vercel
- Allow 24-48 hours for DNS propagation
- Check SSL certificate status in Vercel dashboard

Need help? Check Vercel documentation or reach out for assistance!