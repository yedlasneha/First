# KSR Fruits — Project Documentation

**Version:** 1.0  
**Date:** April 2026  
**Author:** KSR Fruits Development Team

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Project Structure](#4-project-structure)
5. [Database Schema](#5-database-schema)
6. [Backend Services](#6-backend-services)
7. [Frontend Application](#7-frontend-application)
8. [API Reference](#8-api-reference)
9. [Authentication Flow](#9-authentication-flow)
10. [Payment Flow](#10-payment-flow)
11. [Admin Panel Features](#11-admin-panel-features)
12. [Customer App Features](#12-customer-app-features)
13. [Setup & Run Instructions](#13-setup--run-instructions)
14. [Environment Configuration](#14-environment-configuration)
15. [Deployment Notes](#15-deployment-notes)

---

## 1. Project Overview

KSR Fruits is a full-stack quick-commerce web application for selling fresh fruits and dry fruits. It supports:

- Customer-facing storefront with product browsing, cart, checkout, and order tracking
- Admin panel for managing products, orders, banners, benefits, help/FAQ, about us, and payment settings
- OTP-based email authentication (no passwords)
- Online UPI payment with UTR verification
- Bulk order pre-booking
- Profit calculator for the admin
- Dark/light theme toggle
- Wishlist, sort by price, saved delivery addresses, live location detection

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, React Router 7, Axios, Tailwind CSS |
| Backend | Spring Boot 3.2, Java 17, Maven |
| Database | MySQL 8.0 |
| Auth | JWT (JJWT 0.11.5), OTP via Gmail SMTP |
| Architecture | Microservices (4 independent Spring Boot services) |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend (Vite)               │
│                   localhost:5173                     │
└──────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
  Auth :8081  Product :8082  Cart :8083  Order :8084
       │          │          │          │
       └──────────┴──────────┴──────────┘
                        │
                   MySQL :3306
                  (ksrfruits DB)
```

All 4 backend services share a single MySQL database (`ksrfruits`). Hibernate `ddl-auto=update` manages schema automatically.

---

## 4. Project Structure

```
KSR_Fruits/
├── backend/
│   ├── common/                    # Shared DTOs (OrderItemDto, OrderEvent, exceptions)
│   ├── auth-service/              # Port 8081 — Login, OTP, JWT, User profiles
│   ├── product-service/           # Port 8082 — Products, Banners, Benefits, Help, About, Payment Settings, Profit
│   ├── cart-service/              # Port 8083 — Shopping cart (per user)
│   ├── order-service/             # Port 8084 — Orders, Bulk orders, Admin order management
│   └── pom.xml                    # Parent Maven POM
│
├── frontend-react/
│   └── src/
│       ├── api/
│       │   ├── axios.js           # Axios instances: authApi, productApi, cartApi, orderApi
│       │   └── tokenHelper.js     # JWT token helper
│       ├── components/
│       │   ├── AdminNav.jsx       # Admin navigation bar + bottom nav
│       │   ├── ErrorBoundary.jsx  # Global error boundary
│       │   └── ProtectedRoute.jsx # Admin route guard
│       ├── context/
│       │   ├── AuthContext.jsx    # Admin auth state
│       │   ├── UserAuthContext.jsx# Customer auth state + smart OTP routing
│       │   ├── CartContext.jsx    # Cart state synced with cart-service
│       │   ├── BannerContext.jsx  # Banner state from product-service
│       │   ├── ThemeContext.jsx   # Dark/light mode toggle
│       │   └── WishlistContext.jsx# Wishlist (localStorage)
│       └── pages/
│           ├── Home.jsx           # Main storefront
│           ├── UserLogin.jsx      # OTP login page
│           ├── Orders.jsx         # Customer order history
│           ├── Profile.jsx        # Profile + settings + help/terms/about
│           ├── Admin.jsx          # Admin panel (products, orders, banners, etc.)
│           ├── AdminDashboard.jsx # Admin stats dashboard
│           ├── AdminLogin.jsx     # Admin OTP login
│           └── ProfitCalculator.jsx # Profit tracking tool
│
├── database/
│   └── schema.sql                 # MySQL schema (run once on fresh setup)
│
├── start-dev.bat                  # One-click Windows launcher
└── RUN_COMMANDS.md                # Manual run instructions
```

---

## 5. Database Schema

**Database:** `ksrfruits` (MySQL 8.0)

| Table | Service | Description |
|-------|---------|-------------|
| `users` | auth-service | Customer and admin accounts |
| `email_otps` | auth-service | OTP codes (hashed, 5-min expiry) |
| `categories` | product-service | Product categories |
| `products` | product-service | Fruit/dry fruit products |
| `product_variants` | product-service | Size/price variants per product |
| `banners` | product-service | Homepage hero banners |
| `benefits` | product-service | Product health benefits |
| `help_faqs` | product-service | Help & Support FAQ entries |
| `about_us` | product-service | About Us content |
| `payment_settings` | product-service | UPI ID, QR code, bank details |
| `profit_entries` | product-service | Admin profit tracking records |
| `cart_items` | cart-service | Per-user cart items |
| `orders` | order-service | Customer orders |
| `order_items` | order-service | Line items per order |
| `bulk_orders` | order-service | Bulk order pre-bookings |

---

## 6. Backend Services

### 6.1 Auth Service (Port 8081)

Handles user registration, OTP-based login, JWT generation, and profile management.

**Key features:**
- Email OTP login (no passwords) — OTP hashed with BCrypt, 5-minute expiry, 3 attempt limit
- Admin email (`ksrfruitshelp@gmail.com`) uses a separate admin OTP endpoint
- JWT tokens valid for 30 days
- DNS MX record validation on email domain before sending OTP
- Mock mode (`otp.mock.enabled=true`) returns OTP in API response for development
- Profile stores: name, email, address, receiver name, receiver mobile

### 6.2 Product Service (Port 8082)

Manages all product catalog and content data.

**Key features:**
- Products with categories, images (base64 or URL), discount %, stock quantity
- Product variants (different sizes/prices per product)
- Banners with title, subtitle, tag, badges, display order
- Benefits linked to products
- Help & FAQ entries (admin-managed, shown in customer profile)
- About Us entries (admin-managed)
- Payment Settings (UPI ID, QR image, bank details — shown at checkout)
- Profit Calculator entries with daily summary

### 6.3 Cart Service (Port 8083)

Manages per-user shopping carts persisted in MySQL.

**Key features:**
- Add, update quantity, remove, clear cart
- Cart items stored with userId, productId, productName, quantity, price
- Unique constraint on (userId, productId)

### 6.4 Order Service (Port 8084)

Handles order placement, status management, and bulk orders.

**Key features:**
- Place orders with items, delivery address, payment method, UTR reference
- Order statuses: PLACED → ACCEPTED → OUT_FOR_DELIVERY → DELIVERED (or CANCELLED)
- Admin can update order status
- Bulk order pre-booking (fruitName, quantity, unit, deliveryDate, notes)
- Profile completion check before order placement
- Invoice generation (HTML download)

---

## 7. Frontend Application

### Customer App (`/home`)

- **Navbar:** Logo, search bar (with voice search), wishlist icon, user avatar with dropdown
- **Hero Banner:** Auto-rotating banners from admin, with arrows and dots
- **Bulk Order Bar:** Pre-book bulk orders (min 10kg)
- **Categories:** Circular product images as category filters
- **Filter Pills:** All / Fruits / Dry Fruits + Sort by price (Low→High, High→Low)
- **Product Grid:** 2-column responsive grid with wishlist heart, discount badge, stock warning, Add/qty stepper
- **Cart Drawer:** Slide-in from right, item management, checkout button
- **Checkout Flow (2-step):**
  - Step 1: Review items, "Add more" suggestions, saved addresses + live location, payment method
  - Step 2: Final confirm, UPI payment details (QR + deep links), UTR input (required for online)
- **Bottom Nav (mobile):** Home · Buy Again · Cart
- **Dark/Light Mode:** Persisted to localStorage

### Admin Panel (`/admin`)

- **Dashboard:** Active orders, revenue stats, customer count
- **Orders:** Full order list with status pipeline, invoice download/print
- **Products:** Add/edit/delete products with image upload, variants, stock management
- **Benefits:** Product health benefits management
- **Banners:** Homepage banner management with image upload
- **Help:** FAQ entries shown in customer profile
- **Payment:** UPI ID, QR code upload, bank details, payment instructions
- **Bulk Orders:** View and manage bulk order requests
- **About:** About Us content management
- **Profit Calculator:** Daily profit tracking with insights

### Profile Page (`/profile`)

- Avatar with letter-based gradient (unique color per first letter)
- My Orders quick link
- Edit Profile (name, email, delivery address, receiver details)
- Dark/Light mode toggle with animated pill switch
- Expandable sections: Help & Support, Terms & Conditions, About KSR Fruits
- Logout

---

## 8. API Reference

### Auth Service (8081)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to customer email |
| POST | `/api/auth/verify-otp` | Verify OTP, returns JWT |
| POST | `/api/auth/admin/send-otp` | Send OTP to admin email |
| POST | `/api/auth/admin/verify-otp` | Verify admin OTP, returns JWT |
| GET | `/api/auth/profile/:userId` | Get user profile |
| PUT | `/api/auth/profile/:userId` | Update user profile |
| GET | `/api/auth/admin/users` | List all users (admin) |
| POST | `/api/auth/validate` | Validate JWT token |

### Product Service (8082)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | All active products |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| PUT | `/api/products/:id/stock` | Update stock |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/products/:id/variants` | Get product variants |
| PUT | `/api/products/:id/variants/replace` | Replace all variants |
| GET | `/api/banners` | Active banners (customer) |
| GET | `/api/banners/all` | All banners (admin) |
| POST | `/api/banners` | Create banner |
| PUT | `/api/banners/:id` | Update banner |
| DELETE | `/api/banners/:id` | Delete banner |
| GET | `/api/benefits` | All benefits |
| POST | `/api/benefits` | Create benefit |
| GET | `/api/help` | All help FAQs |
| POST | `/api/help` | Create FAQ |
| GET | `/api/about` | About Us entries |
| POST | `/api/about` | Create about entry |
| GET | `/api/payment-settings` | Get payment settings |
| POST | `/api/payment-settings` | Save payment settings |
| GET | `/api/profit` | Profit entries |
| POST | `/api/profit` | Add profit entry |
| GET | `/api/profit/today/summary` | Today's profit summary |

### Cart Service (8083)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cart/add` | Add item to cart |
| GET | `/api/cart/:userId` | Get user's cart |
| PUT | `/api/cart/update` | Update item quantity |
| DELETE | `/api/cart/:userId/:productId` | Remove item |
| DELETE | `/api/cart/clear/:userId` | Clear entire cart |

### Order Service (8084)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place order |
| GET | `/api/orders/my?userId=:id` | Customer's orders |
| GET | `/api/orders/:id` | Single order |
| GET | `/api/admin/orders` | All orders (admin) |
| PUT | `/api/admin/orders/:id/status` | Update order status |
| POST | `/api/bulk-orders` | Place bulk order |
| GET | `/api/bulk-orders` | All bulk orders (admin) |
| GET | `/api/bulk-orders/my?userId=:id` | Customer's bulk orders |
| PUT | `/api/bulk-orders/:id/status` | Update bulk order status |

---

## 9. Authentication Flow

```
Customer Login:
  1. Enter email → POST /api/auth/send-otp
  2. Backend validates email (format + DNS MX check)
  3. OTP generated, hashed (BCrypt), stored in DB (5-min expiry)
  4. OTP sent via Gmail SMTP (or returned in devOtp field in dev mode)
  5. Enter OTP → POST /api/auth/verify-otp
  6. Backend verifies hash, returns JWT + user data
  7. Frontend stores JWT in localStorage (user_token)
  8. If role=ADMIN → redirect to /admin, else → /home

Admin Login:
  Same flow but uses /api/auth/admin/send-otp and /api/auth/admin/verify-otp
  Only ksrfruitshelp@gmail.com is allowed
```

**JWT payload:** `{ userId, email, role, iat, exp }`  
**Token expiry:** 30 days  
**Algorithm:** HS256

---

## 10. Payment Flow

### Cash on Delivery
1. Customer selects COD at checkout
2. Order placed immediately
3. Admin delivers and collects cash

### Online Payment (UPI)
1. Admin configures UPI ID, QR code, bank details in Admin → Payment tab
2. Customer selects Online Payment at checkout
3. Step 2 shows QR code (tappable → opens UPI app) + GPay/PhonePe/Paytm/BHIM deep-link buttons
4. Customer pays via their UPI app
5. Customer enters UTR/Transaction ID (min 6 chars) in the input field
6. Place Order button unlocks only after UTR is entered
7. UTR stored as `paymentId` on the order — admin can verify it

---

## 11. Admin Panel Features

| Feature | Description |
|---------|-------------|
| Dashboard | Live stats: active orders, revenue, today's revenue, customer count |
| Orders | View all orders, update status (PLACED→ACCEPTED→OUT_FOR_DELIVERY→DELIVERED), cancel, view/print/download invoice |
| Products | Add/edit/delete products, upload images (base64), set price/discount/stock/category/unit, manage variants |
| Benefits | Add health benefits linked to products |
| Banners | Upload hero banners with title/subtitle/tag/badges, reorder |
| Help | Manage FAQ entries shown in customer profile |
| Payment | Configure UPI ID, QR code (file upload or URL), bank details, payment instructions |
| Bulk Orders | View and manage bulk order requests from customers |
| About | Manage About Us content shown in customer profile |
| Profit Calculator | Track daily buy/sell prices, calculate profit/loss, view history and insights |

---

## 12. Customer App Features

| Feature | Description |
|---------|-------------|
| Browse Products | Grid view with images, prices, discount badges, stock warnings |
| Search | Text search + voice search (Web Speech API) |
| Filter | By category (All/Fruits/Dry Fruits) + sort by price |
| Wishlist | Heart icon on products, saved to localStorage |
| Cart | Add/remove/update quantities, synced with backend |
| Checkout | 2-step: review + confirm, saved addresses, live location, UTR for online payment |
| Invoice | Auto-downloaded as HTML after order placement |
| Orders | Full order history with status tracker |
| Bulk Orders | Pre-book large quantities with delivery date |
| Profile | Edit personal info, delivery address, dark/light mode, help/terms/about |
| Buy Again | Bottom sheet showing items from past orders |

---

## 13. Setup & Run Instructions

### Prerequisites

| Tool | Version |
|------|---------|
| Java JDK | 17+ |
| Maven | 3.8+ |
| Node.js | 18+ |
| MySQL | 8.0 |

### Quick Start (Windows)

```bat
:: 1. Start MySQL service
net start MYSQL80

:: 2. Double-click start-dev.bat
:: OR run manually:
start-dev.bat
```

### Manual Setup

```bash
# 1. Create database
mysql -u root -proot -h 127.0.0.1 < database/schema.sql

# 2. Build backend
cd backend
mvn clean package -DskipTests
cd ..

# 3. Start services (separate terminals)
java -jar backend/auth-service/target/auth-service-1.0.0.jar      # :8081
java -jar backend/product-service/target/product-service-1.0.0.jar # :8082
java -jar backend/cart-service/target/cart-service-1.0.0.jar       # :8083
java -jar backend/order-service/target/order-service-1.0.0.jar     # :8084

# 4. Start frontend
cd frontend-react
npm install
npm run dev
```

### Access URLs

| URL | Description |
|-----|-------------|
| http://localhost:5173/home | Customer storefront |
| http://localhost:5173/login | Customer login |
| http://localhost:5173/admin-login | Admin login |
| http://localhost:5173/admin | Admin panel |

---

## 14. Environment Configuration

### Auth Service (`application.properties`)

```properties
server.port=8081
jwt.secret=<256-bit secret key>
jwt.expiration=2592000000          # 30 days in ms
spring.mail.username=ksrfruitshelp@gmail.com
spring.mail.password=<Gmail App Password>
otp.mock.enabled=false             # Set true for dev (returns OTP in API response)
```

### All Services (shared DB config)

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ksrfruits
spring.datasource.username=root
spring.datasource.password=root
```

### Frontend (`src/api/axios.js`)

```js
const AUTH_URL    = 'http://localhost:8081';
const PRODUCT_URL = 'http://localhost:8082';
const CART_URL    = 'http://localhost:8083';
const ORDER_URL   = 'http://localhost:8084';
```

---

## 15. Deployment Notes

### Production Checklist

- [ ] Set `otp.mock.enabled=false` in auth-service
- [ ] Configure real Gmail App Password in auth-service
- [ ] Change `jwt.secret` to a strong random 256-bit key
- [ ] Change MySQL credentials from `root/root`
- [ ] Set CORS origins to your actual domain (replace `*`)
- [ ] Serve frontend via Nginx/Apache or deploy to Vercel/Netlify
- [ ] Use HTTPS — UPI deep links (`tez://`, `phonepe://`) only work on HTTPS in production
- [ ] Set backend service URLs in `axios.js` to production API URLs
- [ ] Configure MySQL with proper user permissions (not root)

### UPI Deep Links (HTTPS Required)

The payment buttons (GPay, PhonePe, Paytm, BHIM) use custom URL schemes:
- `tez://upi/pay?pa=...` — Google Pay
- `phonepe://pay?pa=...` — PhonePe
- `paytmmp://pay?pa=...` — Paytm
- `upi://pay?pa=...` — BHIM / any UPI app

These only work on mobile browsers over HTTPS. On desktop, they open the installed app if available.

### Admin Email

The admin email is hardcoded as `ksrfruitshelp@gmail.com` in `AuthService.java`. To change it, update the `ADMIN_EMAIL` constant.

---

*KSR Fruits — Fresh fruits at your doorstep*
