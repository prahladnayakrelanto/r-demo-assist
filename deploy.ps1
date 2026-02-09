# ===========================================
# R-AllAssist Deployment Script (Windows PowerShell)
# ===========================================
# This script builds and deploys both frontend and backend to AWS EC2

param(
    [string]$PemFile = "C:\Users\PrahladNayak\AI\PoojaLab\R-AllAssist\EXTERNAL-PROD.pem",
    [string]$Server = "ubuntu@13.233.75.226",
    [string]$RemotePath = "~/R-AllAssist"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  R-AllAssist Full Stack Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build frontend
Write-Host "[1/5] Building frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
Write-Host "Frontend build complete!" -ForegroundColor Green

# Step 2: Upload frontend (dist folder)
Write-Host ""
Write-Host "[2/5] Uploading frontend..." -ForegroundColor Yellow
scp -i $PemFile -r "dist" "${Server}:${RemotePath}/"
if ($LASTEXITCODE -ne 0) { throw "Frontend upload failed" }
Write-Host "Frontend uploaded!" -ForegroundColor Green

# Step 3: Upload backend (server folder)
Write-Host ""
Write-Host "[3/5] Uploading backend..." -ForegroundColor Yellow
scp -i $PemFile -r "server" "${Server}:${RemotePath}/"
if ($LASTEXITCODE -ne 0) { throw "Backend upload failed" }
Write-Host "Backend uploaded!" -ForegroundColor Green

# Step 4: Upload public/presentations folder (for slide decks)
Write-Host ""
Write-Host "[4/5] Uploading presentations..." -ForegroundColor Yellow
scp -i $PemFile -r "public/presentations" "${Server}:${RemotePath}/dist/"
if ($LASTEXITCODE -ne 0) { throw "Presentations upload failed" }
Write-Host "Presentations uploaded!" -ForegroundColor Green

# Step 5: SSH and restart services
Write-Host ""
Write-Host "[5/5] Restarting services on server..." -ForegroundColor Yellow

$remoteCommands = @"
cd $RemotePath

# Install backend dependencies if needed
cd server
npm install --production
cd ..

# Restart both frontend and backend with PM2
pm2 delete r-allassist-frontend 2>/dev/null || true
pm2 delete r-allassist-backend 2>/dev/null || true

# Start backend API server (port 3001)
pm2 start server/index.js --name r-allassist-backend

# Start frontend static server (using serve or your existing setup)
pm2 restart r-allassist 2>/dev/null || pm2 serve dist 5177 --name r-allassist-frontend --spa

pm2 save
pm2 status
"@

ssh -i $PemFile $Server $remoteCommands

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://13.233.75.226" -ForegroundColor Cyan
Write-Host "Backend API: http://13.233.75.226:3001" -ForegroundColor Cyan
Write-Host ""



