#!/bin/bash
# SSL Setup for KSR Fruits EC2
# Run this AFTER your domain DNS is pointing to this EC2 IP
# Usage: bash deploy/ssl-setup.sh

set -e

DOMAIN="ksrfruits.com"
EMAIL="ksrfruitshelp@gmail.com"

echo "=== Installing Certbot ==="
sudo apt-get update -y
sudo apt-get install -y certbot

echo "=== Stopping port 80 temporarily for cert issuance ==="
# Stop nginx container briefly so certbot can bind to port 80
docker stop ksr-api-gateway 2>/dev/null || true

echo "=== Obtaining SSL certificate for $DOMAIN ==="
sudo certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

echo "=== Copying certs to project ==="
sudo mkdir -p /home/ubuntu/ksrfruits/ssl
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /home/ubuntu/ksrfruits/ssl/
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem   /home/ubuntu/ksrfruits/ssl/
sudo chown ubuntu:ubuntu /home/ubuntu/ksrfruits/ssl/*.pem

echo "=== Switching to HTTPS nginx config ==="
cp /home/ubuntu/ksrfruits/api-gateway-ssl.conf /home/ubuntu/ksrfruits/api-gateway.conf

echo "=== Restarting API gateway with SSL ==="
docker start ksr-api-gateway 2>/dev/null || docker-compose up -d api-gateway

echo "=== Setting up auto-renewal ==="
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker restart ksr-api-gateway") | crontab -

echo ""
echo "=== SSL setup complete! ==="
echo "Test: https://$DOMAIN"
