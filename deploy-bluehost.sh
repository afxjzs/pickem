#!/bin/bash

# Bluehost Deployment Script
# This script helps prepare your app for Bluehost deployment

set -e

echo "🚀 Preparing Next.js app for Bluehost deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
	echo "❌ Error: package.json not found. Run this script from the project root."
	exit 1
fi

# Build the application
echo "📦 Building application..."
npm run build

# Create deployment directory
DEPLOY_DIR="bluehost-deploy"
echo "📁 Creating deployment package..."

# Clean up old deployment directory
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files
echo "📋 Copying files..."
cp -r .next "$DEPLOY_DIR/"
cp -r public "$DEPLOY_DIR/" 2>/dev/null || true
cp -r src "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/" 2>/dev/null || true
cp next.config.* "$DEPLOY_DIR/" 2>/dev/null || true
cp tsconfig.json "$DEPLOY_DIR/" 2>/dev/null || true
cp ecosystem.config.js "$DEPLOY_DIR/"
cp .htaccess "$DEPLOY_DIR/"

# Create .env.local template
echo "📝 Creating .env.local template..."
cat > "$DEPLOY_DIR/.env.local.template" << 'EOF'
# Copy this to .env.local and fill in your values
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.com
EOF

# Create deployment instructions
cat > "$DEPLOY_DIR/DEPLOY_INSTRUCTIONS.txt" << 'EOF'
BLUEHOST DEPLOYMENT INSTRUCTIONS
================================

1. Upload this entire directory to your Bluehost server via:
   - SCP: scp -r bluehost-deploy/* user@domain.com:~/public_html/pickem/
   - Or use FileZilla/SFTP

2. SSH into Bluehost:
   ssh user@domain.com

3. Navigate to deployment directory:
   cd ~/public_html/pickem

4. Install production dependencies:
   npm install --production

5. Create .env.local file:
   cp .env.local.template .env.local
   nano .env.local
   # Fill in your actual values

6. Update ecosystem.config.js:
   nano ecosystem.config.js
   # Update the 'cwd' path to match your actual path

7. Create logs directory:
   mkdir -p logs

8. Install PM2 (if not already installed):
   npm install -g pm2

9. Start the application:
   pm2 start ecosystem.config.js

10. Set PM2 to start on reboot:
    pm2 startup
    # Follow the instructions
    pm2 save

11. Check status:
    pm2 status
    pm2 logs pickem-app

12. Configure your domain/subdomain in cPanel to point to this directory

For detailed instructions, see DEPLOY_BLUEHOST.md
EOF

# Create tarball
echo "📦 Creating tarball..."
tar -czf bluehost-deploy.tar.gz -C "$DEPLOY_DIR" .

echo "✅ Deployment package created!"
echo ""
echo "📦 Files created:"
echo "   - $DEPLOY_DIR/ (directory with all files)"
echo "   - bluehost-deploy.tar.gz (compressed package)"
echo ""
echo "📋 Next steps:"
echo "   1. Review $DEPLOY_DIR/DEPLOY_INSTRUCTIONS.txt"
echo "   2. Upload to Bluehost via SCP or SFTP"
echo "   3. Follow the instructions in DEPLOY_INSTRUCTIONS.txt"
echo ""
echo "💡 Quick upload command:"
echo "   scp -r $DEPLOY_DIR/* your-username@your-domain.com:~/public_html/pickem/"



