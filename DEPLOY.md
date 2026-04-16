
# KSR Fruits — Production Deployment Guide
## ksrfruits.com | AWS EC2 + Docker + Android APK

---

# PHASE 1 — Deploy Website (No Payment Yet)

## Step 1 — Launch AWS EC2

1. AWS Console → EC2 → Launch Instance
2. Settings:
   - AMI: **Ubuntu Server 22.04 LTS** (Free Tier)
   - Type: **t2.micro** (Free Tier)
   - Key pair: Create new → download `ksr-key.pem`
   - Security Group inbound rules:
     ```
     SSH   port 22   → My IP only
     HTTP  port 80   → 0.0.0.0/0
     HTTPS port 443  → 0.0.0.0/0
     ```
   - Storage: 20 GB

3. Note your **EC2 Public IP** (e.g. `13.235.xx.xx`)

---

## Step 2 — Upload Project to EC2

Run this on your **Windows machine** (Git Bash or WSL):

```bash
# Make key secure
chmod 400 ksr-key.pem

# Upload entire project
scp -i ksr-key.pem -r . ubuntu@<EC2-IP>:~/ksrfruits

# SSH into server
ssh -i ksr-key.pem ubuntu@<EC2-IP>
```

---

## Step 3 — Install Docker & Tools on EC2

```bash
cd ~/ksrfruits
bash deploy/aws-setup.sh

# Log out and back in (docker group needs refresh)
exit
ssh -i ksr-key.pem ubuntu@<EC2-IP>
```

---

## Step 4 — Configure Environment

```bash
cd ~/ksrfruits
cp .env.example .env
nano .env
```

Fill in these values (leave Razorpay blank for now):

```env
DB_USERNAME=ksruser
DB_PASSWORD=KsrFruits@2026!

# Generate: openssl rand -hex 64
JWT_SECRET=paste_64_char_hex_here

# Gmail App Password (myaccount.google.com → Security → App Passwords)
GMAIL_USERNAME=ksrfruitshelp@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Leave blank for now — add in Phase 2
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Save: `Ctrl+X → Y → Enter`

---

## Step 5 — Deploy Website

```bash
cd ~/ksrfruits
bash deploy/phase1-website.sh
```

This builds all 4 Spring Boot services + React frontend + starts all Docker containers.
Takes about 5–10 minutes.

---

## Step 6 — Point Domain to EC2

In your domain registrar (GoDaddy / Namecheap / Hostinger):

| Type | Host | Value          |
|------|------|----------------|
| A    | @    | `<EC2-IP>`     |
| A    | www  | `<EC2-IP>`     |

Wait 5–15 minutes. Test: `ping ksrfruits.com`

---

## Step 7 — Enable HTTPS (SSL)

After DNS is pointing to EC2:

```bash
bash deploy/ssl-setup.sh
```

Test: Open **https://ksrfruits.com** in browser ✅

---

# PHASE 2 — Build Android APK

Do this on your **Windows machine** (not EC2).

### Prerequisites
- [Android Studio](https://developer.android.com/studio) installed
- Java 17 installed
- Node.js 20 installed

### Build APK

```bat
:: From project root on Windows
deploy\build-android-apk.bat
```

This will:
1. `npm install` — install dependencies
2. `npm run build` — build web app
3. `npx cap add android` — add Android platform (first time)
4. `npx cap sync android` — copy web build into Android
5. Open Android Studio

### In Android Studio:
1. Wait for Gradle sync (2–3 minutes)
2. **Build → Generate Signed Bundle / APK**
3. Select **APK**
4. **Create new keystore:**
   - Path: `C:\Users\YourName\ksr-keystore.jks`
   - Password: something strong (save it — needed for every update)
   - Alias: `ksrfruits`
5. Build Type: **release**
6. Click **Finish**

APK location:
```
frontend-react\android\app\build\outputs\apk\release\app-release.apk
```

### Install on Android Phone:
1. Phone Settings → Security → **Install unknown apps** → ON
2. Transfer APK via USB cable or WhatsApp
3. Tap APK file → Install

### For Google Play Store:
- Choose **Android App Bundle (.aab)** instead of APK
- Upload to [play.google.com/console](https://play.google.com/console)

---

# PHASE 3 — Add Razorpay Payment

Do this AFTER website is live at https://ksrfruits.com

### Step 1 — Complete Razorpay Registration
1. Login: [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Fill in business details:
   - Business name: KSR Fruits
   - Website: https://ksrfruits.com
   - Category: Grocery / Food & Beverages
3. Add bank account for settlements
4. Wait for KYC approval (1–2 business days)

### Step 2 — Get API Keys
1. Dashboard → **Settings → API Keys**
2. Click **Generate Live Key**
3. Copy **Key ID** and **Key Secret**

### Step 3 — Set Up Webhook
1. Dashboard → **Settings → Webhooks → Add New Webhook**
2. URL: `https://ksrfruits.com/api/payment/webhook`
3. Secret: create any strong string (e.g. `KsrWebhook@2026!`)
4. Enable events:
   - ✅ `payment.captured`
   - ✅ `order.paid`
   - ✅ `payment.failed`
5. Save

### Step 4 — Add Keys to Server

```bash
# SSH into EC2
ssh -i ksr-key.pem ubuntu@<EC2-IP>
cd ~/ksrfruits
nano .env
```

Add your keys:
```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=KsrWebhook@2026!
```

### Step 5 — Redeploy with Payment

```bash
bash deploy/phase2-payment.sh
```

This rebuilds only the order-service and frontend — takes ~3 minutes.

### Step 6 — Rebuild APK with Payment

```bat
:: On Windows machine — rebuild APK with Razorpay
deploy\build-android-apk.bat
```

---

# Useful Commands

```bash
# Check all containers
docker-compose ps

# View logs
docker-compose logs -f
docker-compose logs order-service --tail=50

# Restart one service
docker-compose restart auth-service

# Full redeploy
bash deploy/build-and-deploy.sh

# Backup database
docker exec ksr-mysql mysqldump \
  -u root -p"$DB_PASSWORD" ksrfruits \
  > backup_$(date +%Y%m%d_%H%M).sql

# Check disk / memory
df -h
free -h
docker stats --no-stream
```

---

# Architecture

```
Customer Browser / Android App
         │
         ▼
   ksrfruits.com
         │
         ▼
  EC2 t2.micro (Ubuntu 22.04)
         │
         ▼
  Nginx :443 (SSL + Reverse Proxy)
         │
    ┌────┴────────────────────────────┐
    │                                 │
    ▼                                 ▼
frontend:80              /api/* routes
(React SPA)                   │
                    ┌─────────┼──────────────┐
                    ▼         ▼              ▼
              auth:8081  product:8082   cart:8083
                              │
                         order:8084
                         (+ Razorpay)
                              │
                         MySQL:3306
                        (ksrfruits DB)
```

---

# Payment Flow (After Phase 3)

```
Customer clicks "Pay ₹X"
    → Backend creates Razorpay order
    → Razorpay popup opens
    → Customer pays (GPay / PhonePe / Paytm / UPI / Card)
    → Backend verifies HMAC-SHA256 signature
    → KSR order placed in DB with paymentId
    → Status = PAID ✅
    → Invoice auto-downloads
    → Money in your bank: T+2 days
```

---

# Cost (AWS Free Tier)

| Resource       | Cost              |
|----------------|-------------------|
| EC2 t2.micro   | FREE (12 months)  |
| EBS 20 GB      | FREE (12 months)  |
| Data transfer  | FREE (15 GB/mo)   |
| After 12 months| ~$10–15/month     |

Razorpay fee: **2% per transaction** (no monthly fee)
