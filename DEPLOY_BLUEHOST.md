# Deploying Next.js App to Bluehost

This guide will help you deploy your Next.js Pick'em app to Bluehost via SSH.

## Prerequisites

1. **Bluehost Account with SSH Access**
   - Verify you have SSH access enabled in your Bluehost cPanel
   - Check if Node.js is available (Bluehost supports Node.js on most plans)

2. **Domain Configuration**
   - Your domain should point to your Bluehost account
   - You'll need to configure a subdomain or use your main domain

## Step 1: Check Node.js Version on Bluehost

SSH into your Bluehost account and check Node.js:

```bash
ssh your-username@your-domain.com
node -v
npm -v
```

If Node.js is not available, you may need to:
- Enable it in cPanel (Node.js Selector)
- Or use a Node.js version manager like `nvm`

**Note**: Bluehost typically provides Node.js 16+ which should work with Next.js 16.

## Step 2: Prepare Your Application

### Option A: Build Locally and Upload

1. **Build the application locally:**
```bash
npm run build
```

2. **Create a deployment package:**
```bash
# Create a tarball excluding unnecessary files
tar -czf pickem-deploy.tar.gz \
  --exclude='.git' \
  --exclude='.next/cache' \
  --exclude='node_modules' \
  --exclude='.env.local' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  .
```

3. **Upload to Bluehost:**
```bash
# Using SCP
scp pickem-deploy.tar.gz your-username@your-domain.com:~/pickem-deploy.tar.gz
```

### Option B: Clone from Git (Recommended)

If you have your code in a Git repository:

```bash
ssh your-username@your-domain.com
cd ~/public_html  # or wherever you want to deploy
git clone your-repo-url pickem
cd pickem
```

## Step 3: Set Up on Bluehost Server

1. **SSH into Bluehost:**
```bash
ssh your-username@your-domain.com
```

2. **Navigate to your deployment directory:**
```bash
# Option 1: Use a subdomain (recommended)
cd ~/public_html/pickem.yourdomain.com

# Option 2: Use main domain subdirectory
cd ~/public_html/pickem

# Option 3: Use main domain (if you want it at root)
cd ~/public_html
```

3. **Extract files (if using tarball):**
```bash
tar -xzf ~/pickem-deploy.tar.gz
```

4. **Install dependencies:**
```bash
npm install --production
```

5. **Create environment file:**
```bash
nano .env.local
```

Add your environment variables:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration (if using)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.com
```

Save and exit (Ctrl+X, then Y, then Enter)

6. **Build the application:**
```bash
npm run build
```

## Step 4: Set Up Process Manager (PM2)

PM2 will keep your app running and restart it if it crashes.

1. **Install PM2 globally:**
```bash
npm install -g pm2
```

2. **Create a PM2 ecosystem file:**
```bash
nano ecosystem.config.js
```

Add this content:
```javascript
module.exports = {
  apps: [{
    name: 'pickem-app',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/home/your-username/public_html/pickem', // Update with your path
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_TELEMETRY_DISABLED: 1
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
```

**Important**: Update the `cwd` path to match your actual deployment directory.

3. **Create logs directory:**
```bash
mkdir -p logs
```

4. **Start the application:**
```bash
pm2 start ecosystem.config.js
```

5. **Set PM2 to start on server reboot:**
```bash
pm2 startup
# Follow the instructions it provides
pm2 save
```

6. **Check status:**
```bash
pm2 status
pm2 logs pickem-app
```

## Step 5: Configure Domain/Subdomain

### Option A: Using a Subdomain (Recommended)

1. **In Bluehost cPanel:**
   - Go to "Subdomains"
   - Create subdomain: `pickem.yourdomain.com`
   - Point it to: `public_html/pickem` (or your deployment directory)

2. **Set up reverse proxy in `.htaccess`:**
```bash
cd ~/public_html/pickem
nano .htaccess
```

Add this (if using Apache):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Proxy to Next.js server
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
</IfModule>
```

### Option B: Using Main Domain with Port

If Bluehost allows custom ports, you can access directly:
- `https://your-domain.com:3000`

### Option C: Using cPanel Node.js App

1. **In Bluehost cPanel:**
   - Go to "Node.js Selector"
   - Create a new application
   - Set:
     - Application Root: `pickem`
     - Application URL: `pickem` (or subdomain)
     - Application Startup File: `server.js` (see below)
     - Node.js Version: Latest LTS

2. **Create a simple server.js wrapper:**
```bash
nano server.js
```

```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
```

## Step 6: SSL Certificate

1. **In Bluehost cPanel:**
   - Go to "SSL/TLS Status"
   - Install a free Let's Encrypt certificate for your domain/subdomain

## Step 7: Firewall Configuration

If your app doesn't load, you may need to:

1. **Check if port 3000 is open:**
   - Contact Bluehost support to open port 3000
   - Or use the reverse proxy method (Option A above)

## Step 8: Monitoring and Maintenance

### View Logs:
```bash
pm2 logs pickem-app
# Or
tail -f logs/out.log
```

### Restart Application:
```bash
pm2 restart pickem-app
```

### Stop Application:
```bash
pm2 stop pickem-app
```

### Update Application:
```bash
cd ~/public_html/pickem
git pull  # if using git
npm install --production
npm run build
pm2 restart pickem-app
```

## Troubleshooting

### App won't start:
1. Check Node.js version: `node -v` (needs 18+)
2. Check logs: `pm2 logs pickem-app`
3. Verify environment variables: `cat .env.local`
4. Check port availability: `netstat -tulpn | grep 3000`

### 502 Bad Gateway:
- Reverse proxy not configured correctly
- Next.js server not running
- Port mismatch

### Out of Memory:
- Increase PM2 memory limit in `ecosystem.config.js`
- Or upgrade Bluehost plan

### Build Fails:
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for TypeScript errors: `npm run type-check`

## Alternative: Use Vercel (Easier)

If Bluehost proves difficult, consider deploying to Vercel (made by Next.js creators):

1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

Vercel offers free tier with excellent Next.js support.

## Security Notes

1. **Never commit `.env.local`** to Git
2. **Use strong secrets** for `NEXTAUTH_SECRET`
3. **Keep dependencies updated**: `npm audit fix`
4. **Use HTTPS** (SSL certificate)
5. **Restrict file permissions**: `chmod 600 .env.local`

## Next Steps

After deployment:
1. Test all functionality
2. Set up monitoring/alerting
3. Configure backups
4. Set up CI/CD for future updates

