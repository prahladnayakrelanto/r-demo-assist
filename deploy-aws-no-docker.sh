#!/bin/bash

# ===========================================
# AWS EC2 Deployment Script (Without Docker)
# ===========================================
# Run this script on your AWS EC2 instance

set -e

echo "🚀 Starting R-AllAssist deployment on AWS (without Docker)..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y 2>/dev/null || sudo apt-get update -y

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    # For Amazon Linux 2
    if [ -f /etc/amazon-linux-release ] || [ -f /etc/system-release ]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    # For Ubuntu
    elif [ -f /etc/lsb-release ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    echo "✅ Node.js installed: $(node --version)"
else
    echo "✅ Node.js already installed: $(node --version)"
fi

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing nginx..."
    sudo yum install -y nginx 2>/dev/null || sudo apt-get install -y nginx
    echo "✅ nginx installed"
fi

# Install dependencies and build
echo "📦 Installing npm dependencies..."
npm ci

echo "🔨 Building application..."
npm run build

# Copy build files to nginx directory
echo "📁 Deploying to nginx..."
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r dist/* /usr/share/nginx/html/

# Configure nginx
sudo tee /etc/nginx/conf.d/r-allassist.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Remove default nginx config if it exists
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Start/restart nginx
echo "🚀 Starting nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "============================================"
echo "✅ Deployment complete!"
echo "============================================"
echo ""
echo "Your application is now running at:"
echo "  http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR_EC2_PUBLIC_IP')"
echo ""
echo "Useful commands:"
echo "  View nginx logs:  sudo tail -f /var/log/nginx/access.log"
echo "  Restart nginx:    sudo systemctl restart nginx"
echo "  Check status:     sudo systemctl status nginx"
echo ""







