#!/bin/bash
# ===========================================
# R-AllAssist Server Setup Script
# ===========================================
# Run this ONCE on your EC2 instance to set up the environment

set -e

echo ""
echo "========================================"
echo "  R-AllAssist Server Setup"
echo "========================================"
echo ""

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "[1/5] Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js installed: $(node -v)"
else
    echo "✅ Node.js already installed: $(node -v)"
fi

# Install Python and venv if not present
echo "[2/5] Ensuring Python and venv are installed..."
sudo apt-get update -qq
sudo apt-get install -y python3 python3-venv python3-full -qq
echo "✅ Python installed: $(python3 --version)"

# Create Python virtual environment for the app
echo "[3/5] Setting up Python virtual environment..."
VENV_PATH=~/R-AllAssist/venv
if [ ! -d "$VENV_PATH" ]; then
    mkdir -p ~/R-AllAssist
    python3 -m venv $VENV_PATH
    echo "✅ Virtual environment created at $VENV_PATH"
else
    echo "✅ Virtual environment already exists"
fi

# Install python-pptx in the virtual environment
echo "[4/5] Installing python-pptx in virtual environment..."
$VENV_PATH/bin/pip install --upgrade pip -q
$VENV_PATH/bin/pip install python-pptx -q
echo "✅ python-pptx installed"

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "[5/5] Installing PM2..."
    sudo npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 already installed"
fi

# Create application directories
mkdir -p ~/R-AllAssist/server/data
mkdir -p ~/R-AllAssist/dist/presentations/slides

# Create a wrapper script to use the venv Python
cat > ~/R-AllAssist/run-python.sh << 'EOF'
#!/bin/bash
~/R-AllAssist/venv/bin/python "$@"
EOF
chmod +x ~/R-AllAssist/run-python.sh

echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "Python virtual environment: ~/R-AllAssist/venv"
echo "Use ~/R-AllAssist/venv/bin/python for Python scripts"
echo ""
echo "Now you can deploy the application!"
echo ""
