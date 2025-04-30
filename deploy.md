# Deploying Your GitHub Repository Visualization Application to Vercel

This guide will walk you through the process of deploying your application from a local machine to Vercel. By following these steps carefully, you'll have your application up and running on Vercel in no time.

## Prerequisites

Before starting the deployment process, ensure you have the following:

1. Your application code downloaded as a ZIP from Replit and extracted on your local machine
2. [Node.js](https://nodejs.org/) (version 14 or higher) installed on your computer
3. [Git](https://git-scm.com/) installed on your computer
4. A [Vercel account](https://vercel.com/signup) (you can sign up with GitHub, GitLab, or email)
5. The [Vercel CLI](https://vercel.com/docs/cli) installed (optional but recommended)

## Step 1: Prepare Your Project for Deployment

1. Open your terminal/command prompt and navigate to your project directory:
   ```bash
   cd path/to/your/extracted/project
   ```

2. Initialize a Git repository if not already initialized:
   ```bash
   git init
   ```

3. Create a `.gitignore` file (if not already present) to exclude unnecessary files:
   ```bash
   node_modules
   .DS_Store
   .env
   .env.local
   dist
   build
   ```

4. Create a `vercel.json` file in the root directory to configure your deployment:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/index.ts",
         "use": "@vercel/node"
       },
       {
         "src": "client/index.html",
         "use": "@vercel/static"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "server/index.ts"
       },
       {
         "src": "/ws",
         "dest": "server/index.ts"
       },
       {
         "handle": "filesystem"
       },
       {
         "src": "/(.*)",
         "dest": "client/index.html"
       }
     ]
   }
   ```

5. Modify your server code to support serverless deployment by updating `server/index.ts`:

   Add the following code at the bottom of your file:
   ```typescript
   // Export for serverless deployment
   export default app;
   ```

## Step 2: Install Dependencies and Build Your Application

1. Install project dependencies:
   ```bash
   npm install
   ```

2. Build your application:
   ```bash
   npm run build
   ```

3. Test your application locally to ensure everything works:
   ```bash
   npm run dev
   ```

## Step 3: Deploy to Vercel Using CLI (Recommended)

1. Install Vercel CLI if you haven't already:
   ```bash
   npm install -g vercel
   ```

2. Log in to your Vercel account:
   ```bash
   vercel login
   ```

3. Deploy your application:
   ```bash
   vercel
   ```

4. Follow the CLI prompts:
   - Set up and deploy: `Y`
   - Link to existing project: `N` (unless you've previously deployed this project)
   - Project name: use the default or enter a custom name
   - Directory: press Enter to use the current directory
   - Build settings: use the defaults unless you have specific requirements

5. Wait for the deployment to complete. The CLI will provide a URL to your deployed application when it's done.

## Step 4: Deploy to Vercel Using the Web Interface (Alternative)

If you prefer using the web interface:

1. Commit your changes to Git:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   ```

2. Push your code to a GitHub repository:
   ```bash
   # Create a new repository on GitHub first, then:
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

3. Go to [Vercel Dashboard](https://vercel.com/dashboard)

4. Click "New Project"

5. Import your GitHub repository

6. Configure your project:
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: Leave blank or use `client/dist` if applicable
   - Install Command: `npm install`

7. Click "Deploy" and wait for the deployment to complete

## Step 5: Configure Environment Variables (If Needed)

If your application requires environment variables:

1. Go to your project in the Vercel dashboard

2. Navigate to Settings > Environment Variables

3. Add your environment variables such as:
   - `DATABASE_URL` (if you're using a database)
   - Any API keys your application needs

4. Click "Save" after adding all required variables

## Step 6: Set Up Custom Domain (Optional)

1. Go to your project in the Vercel dashboard

2. Navigate to Settings > Domains

3. Enter your domain name and click "Add"

4. Follow Vercel's instructions to configure your DNS settings

## Troubleshooting Common Issues

### Issue: API Routes Not Working

If your API routes aren't working, check:
- Your `vercel.json` routing configuration
- That you've properly exported your Express app
- Any CORS issues (Vercel might deploy frontend and backend to different domains)

### Issue: WebSocket Connection Failing

For WebSocket support on Vercel:
- Make sure you're using secure WebSocket connections (`wss://` instead of `ws://`)
- Update your client code to use relative WebSocket URLs
- Consider using Vercel's serverless functions with Socket.IO or a third-party service like Pusher

### Issue: Build Failures

If your build is failing:
- Check Vercel build logs for specific errors
- Make sure all dependencies are properly listed in `package.json`
- Try building locally first to identify issues

## Maintaining Your Deployment

- Vercel automatically rebuilds and redeploys when you push changes to your connected Git repository
- Monitor your application performance through the Vercel dashboard
- Set up logging and monitoring tools for production use

## Conclusion

You've successfully deployed your GitHub Repository Visualization Application to Vercel! Your application is now accessible worldwide through Vercel's global CDN.

If you encounter any issues during deployment, consult the [Vercel documentation](https://vercel.com/docs) or reach out to Vercel support for assistance.