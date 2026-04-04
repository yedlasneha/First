# KSR Fruits — How to Run

## One-Click Start (Windows)

Double-click **`start-dev.bat`** from the project root. It does everything:

1. Checks Java & MySQL
2. Creates the `ksrfruits` database if missing
3. Applies the schema
4. Builds all backend services with Maven
5. Starts 4 Java services in separate windows
6. Starts the React frontend

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Java JDK | 17+ | `java -version` |
| Maven | 3.8+ | `mvn -version` |
| Node.js | 18+ | `node -v` |
| MySQL | 8.0 | Must be running |

> **Java path** is set in `start-dev.bat` line 12. Change `JAVA_HOME` if your Java is installed elsewhere.

---

## Manual Steps (if bat file fails)

### Step 1 — Start MySQL

```bat
net start MYSQL80
```

Or open **Services** → find **MySQL80** → Start.

### Step 2 — Create Database

```sql
mysql -u root -proot -h 127.0.0.1 < database/schema.sql
```

### Step 3 — Build Backend

```bat
cd backend
mvn clean package -DskipTests
cd ..
```

### Step 4 — Start Each Service (separate terminals)

```bat
:: Terminal 1
java -jar backend/auth-service/target/auth-service-1.0.0.jar

:: Terminal 2 (after auth is up)
java -jar backend/product-service/target/product-service-1.0.0.jar

:: Terminal 3
java -jar backend/cart-service/target/cart-service-1.0.0.jar

:: Terminal 4
java -jar backend/order-service/target/order-service-1.0.0.jar
```

### Step 5 — Start Frontend

```bat
cd frontend-react
npm install
npm run dev
```

---

## Service URLs

| Service | URL |
|---------|-----|
| Customer App | http://localhost:5173/home |
| Admin Panel | http://localhost:5173/admin-login |
| Auth API | http://localhost:8081 |
| Product API | http://localhost:8082 |
| Cart API | http://localhost:8083 |
| Order API | http://localhost:8084 |
| MySQL | localhost:3306 / ksrfruits |

---

## Login

### Customer
- Go to http://localhost:5173/login
- Enter any email → OTP sent to that email
- Enter OTP to login

### Admin
- Go to http://localhost:5173/admin-login
- Email: `ksrfruitshelp@gmail.com`
- OTP sent to that Gmail

---

## Database

All services share one MySQL database:

```
Host     : localhost:3306
Database : ksrfruits
Username : root
Password : root
```

Hibernate `ddl-auto=update` auto-creates/updates all tables on startup.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cannot connect to MySQL` | Run `net start MYSQL80` as Administrator |
| `Port already in use` | `netstat -ano \| findstr :8081` → `taskkill /PID <pid> /F` |
| `BUILD FAILED` | Check Java 17+: `java -version` |
| Frontend blank page | Check browser console; ensure all 4 backend services are running |
| OTP email not received | Check Gmail spam; or set `otp.mock.enabled=true` in auth `application.properties` for dev |
| `JAVA_HOME` error | Edit line 12 of `start-dev.bat` to point to your JDK |

---

## Project Structure

```
KSR_Fruits/
├── backend/
│   ├── common/              → Shared DTOs
│   ├── auth-service/        → Port 8081 (Login, OTP, Profile)
│   ├── product-service/     → Port 8082 (Products, Banners, Benefits, Help, About)
│   ├── cart-service/        → Port 8083 (Cart)
│   ├── order-service/       → Port 8084 (Orders, Bulk Orders)
│   └── pom.xml              → Parent POM
├── frontend-react/          → React + Vite (Port 5173)
│   └── src/
│       ├── pages/           → Home, Orders, Profile, Admin, AdminDashboard, ...
│       ├── context/         → AuthContext, UserAuthContext, CartContext, BannerContext
│       └── api/             → axios.js (authApi, productApi, cartApi, orderApi)
├── database/
│   └── schema.sql           → MySQL schema (run once on fresh setup)
├── start-dev.bat            → One-click launcher (Windows)
└── RUN_COMMANDS.md          → This file
```
