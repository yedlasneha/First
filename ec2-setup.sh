#!/bin/bash
# KSR Fruits — EC2 Production Setup
# Run once on a fresh Ubuntu 22.04 EC2 instance
# Usage: bash ec2-setup.sh

set -e

echo "=== KSR Fruits EC2 Setup ==="

# 1. Update system
echo "Updating system..."
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose git curl

# 2. Start Docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# 3. Create .env file with all production values
echo "Creating .env..."
cat > /home/ubuntu/ksrfruits/.env << 'EOF'
MYSQL_ROOT_PASSWORD=KsrFruits@2026!
JWT_SECRET=KsrFruitsSecretKeyForJWTTokenGenerationAndValidation2024ThisIsAVeryLongSecretKeyForHS512Algorithm
MAIL_USERNAME=ksrfruitshelp@gmail.com
MAIL_PASSWORD=tfrrkjlufrcmufm
OTP_MOCK=false
EOF

echo "=== Setup complete. Now run: ==="
echo "  newgrp docker"
echo "  cd ~/ksrfruits"
echo "  docker-compose up -d --build"
