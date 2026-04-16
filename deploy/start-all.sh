#!/bin/bash
# KSR Fruits — Complete EC2 startup script
# Run this on EC2: bash deploy/start-all.sh

set -e
cd ~/ksrfruits

echo "=== Pulling latest code ==="
git pull origin main

echo "=== Creating .env if missing ==="
if [ ! -f .env ]; then
cat > .env << 'EOF'
MYSQL_ROOT_PASSWORD=KsrFruits@2026!
JWT_SECRET=KsrFruitsSecretKeyForJWTTokenGenerationAndValidation2024ThisIsAVeryLongSecretKeyForHS512Algorithm
MAIL_USERNAME=ksrfruitshelp@gmail.com
MAIL_PASSWORD=tfrrkjlufrcmufm
OTP_MOCK=false
EOF
echo ".env created"
else
echo ".env already exists"
fi

echo "=== Stopping old containers ==="
docker-compose down --remove-orphans 2>/dev/null || true

echo "=== Building and starting all services ==="
docker-compose up -d --build

echo "=== Waiting 60s for services to start ==="
sleep 60

echo "=== Container status ==="
docker-compose ps

echo "=== Testing health endpoint ==="
curl -s http://localhost/health || echo "Gateway not ready yet — wait 30 more seconds"

echo ""
echo "=== Done! ==="
echo "Test these URLs:"
echo "  Health:   http://54.172.181.237/health"
echo "  Products: http://54.172.181.237/api/products"
echo "  Auth:     http://54.172.181.237/api/auth/send-otp"
