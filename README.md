# Relanto AI First Lab - Accelerators Dashboard

An interactive dashboard to access all Relanto AI accelerators in one place.

## Features

- 🎨 Modern, beautiful UI with gradient backgrounds
- 🔍 Real-time search functionality
- 🏷️ Category filtering (Sales, Analytics, Finance, etc.)
- 📊 Statistics overview
- 🎯 Click any card to open the accelerator in a new tab
- 📱 Fully responsive design
- ✨ Smooth animations and hover effects

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

## AWS EC2 Deployment

### Prerequisites
- AWS EC2 instance (Amazon Linux 2 or Ubuntu recommended)
- Security Group allowing inbound traffic on port 80 (HTTP)
- SSH access to your instance

### Option 1: Deploy with Docker (Recommended)

1. **Launch an EC2 instance:**
   - Use Amazon Linux 2 or Ubuntu 22.04 LTS
   - Instance type: t2.micro (free tier) or t2.small
   - Configure Security Group: Allow SSH (22), HTTP (80)

2. **Connect to your instance:**
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-public-ip
   # For Ubuntu: ssh -i your-key.pem ubuntu@your-ec2-public-ip
   ```

3. **Clone or copy your project to the instance:**
   ```bash
   # Using git
   git clone your-repo-url
   cd R-AllAssist
   
   # Or using scp from your local machine
   scp -i your-key.pem -r ./* ec2-user@your-ec2-public-ip:~/R-AllAssist/
   ```

4. **Run the deployment script:**
   ```bash
   chmod +x deploy-aws.sh
   ./deploy-aws.sh
   ```

5. **Access your app at:** `http://your-ec2-public-ip`

### Option 2: Deploy without Docker

1. Follow steps 1-3 from Option 1

2. **Run the non-Docker deployment script:**
   ```bash
   chmod +x deploy-aws-no-docker.sh
   ./deploy-aws-no-docker.sh
   ```

### Quick Docker Commands (for deployed app)

```bash
# View application logs
sudo docker logs -f r-allassist

# Restart the application
sudo docker restart r-allassist

# Stop the application
sudo docker stop r-allassist

# Rebuild after code changes
sudo docker build -t r-allassist . && sudo docker restart r-allassist
```

### Security Group Configuration

Ensure your EC2 Security Group has these inbound rules:
| Type | Port | Source |
|------|------|--------|
| SSH | 22 | Your IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 (if using SSL) |

## Available Accelerators

The dashboard includes 13 AI accelerators:

- **SalesAssist** (2024 & 2025 versions)
- **TrendAssist** - Demand Planning
- **PartnerAssist** - Partner Finder
- **LoanBook** - Loan Data Extraction
- **Theatre Footfall** - Footfall Analysis
- **Cluster & Opportunity Visualization**
- **Anaplan Embedded Model**
- **FinAssist** - Financial Securities Q&A
- **InfraAssist** - Cloud Infrastructure Q&A
- **CaseAssist** - Bank Balance & Credit Card Agents
- **LiveMeasure** - GroundTruth and Observability

## Technologies Used

- React 18
- Vite
- Lucide React (for icons)
- CSS3 (with animations)

## License

Proprietary - Relanto AI First Lab





