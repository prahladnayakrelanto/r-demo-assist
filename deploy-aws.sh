#!/bin/bash

# ===========================================
# AWS EC2 Deployment Script for R-AllAssist
# ===========================================
# Run this script on your AWS EC2 instance after SSH-ing into it

set -e

echo "🚀 Starting R-AllAssist deployment on AWS..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y 2>/dev/null || sudo apt-get update -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    # For Amazon Linux 2
    if [ -f /etc/amazon-linux-release ] || [ -f /etc/system-release ]; then
        sudo yum install -y docker
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER
    # For Ubuntu
    elif [ -f /etc/lsb-release ]; then
        sudo apt-get install -y docker.io
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER
    fi
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
fi

# Build and run the application
echo "🔨 Building Docker image..."
sudo docker build -t r-allassist .

echo "🛑 Stopping existing container (if any)..."
sudo docker stop r-allassist 2>/dev/null || true
sudo docker rm r-allassist 2>/dev/null || true

echo "🚀 Starting application container..."
sudo docker run -d \
    --name r-allassist \
    --restart unless-stopped \
    -p 80:5177 \
    r-allassist

echo ""
echo "============================================"
echo "✅ Deployment complete!"
echo "============================================"
echo ""
echo "Your application is now running at:"
echo "  http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR_EC2_PUBLIC_IP')"
echo ""
echo "Useful commands:"
echo "  View logs:     sudo docker logs -f r-allassist"
echo "  Stop app:      sudo docker stop r-allassist"
echo "  Restart app:   sudo docker restart r-allassist"
echo ""







