@echo off
:: ============================================================
::   KSR Fruits - Start All Services
::   MySQL: root/root  |  DB: ksrfruits  |  Port: 3306
:: ============================================================
title KSR Fruits - Launcher
color 0A

echo.
echo  ============================================================
echo    KSR Fruits - Full Stack Launcher
echo  ============================================================
echo.

:: ── Java from Anaconda (adjust if your Java is elsewhere) ────────────────
set JAVA_HOME=C:\Users\Lenovo\anaconda3\Library\lib\jvm
set MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin
set PATH=%JAVA_HOME%\bin;%MYSQL_BIN%;C:\Users\Lenovo\anaconda3\Library\bin;%PATH%

:: ── 1. Verify Java ────────────────────────────────────────────────────────
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Java not found. Check JAVA_HOME in this script.
    echo         Current JAVA_HOME: %JAVA_HOME%
    pause & exit /b 1
)
echo [OK] Java found

:: ── 2. Verify MySQL is running ────────────────────────────────────────────
mysql -u root -proot -h 127.0.0.1 -e "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] MySQL not running. Attempting to start MYSQL80...
    net start MYSQL80 >nul 2>&1
    timeout /t 5 /nobreak >nul
    mysql -u root -proot -h 127.0.0.1 -e "SELECT 1;" >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Cannot connect to MySQL.
        echo         Run as Administrator: net start MYSQL80
        echo         Or open Services and start MySQL80 manually.
        pause & exit /b 1
    )
)
echo [OK] MySQL running

:: ── 3. Create database if not exists ─────────────────────────────────────
mysql -u root -proot -h 127.0.0.1 -e "CREATE DATABASE IF NOT EXISTS ksrfruits CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>&1
echo [OK] Database: ksrfruits

:: ── 4. Apply schema (safe - uses IF NOT EXISTS) ───────────────────────────
mysql -u root -proot -h 127.0.0.1 ksrfruits < database\schema.sql >nul 2>&1
echo [OK] Schema applied

:: ── 5. Fix banners table (LONGTEXT for base64 images) ────────────────────
mysql -u root -proot -h 127.0.0.1 ksrfruits -e "ALTER TABLE banners MODIFY COLUMN image_url LONGTEXT;" >nul 2>&1
echo [OK] Banners table ready

:: ── 6. Build backend ──────────────────────────────────────────────────────
echo.
echo [BUILD] Building backend (this takes ~30-60 seconds)...
cd backend
call mvn clean package -DskipTests -q 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Maven build failed. Running with verbose output:
    call mvn clean package -DskipTests
    cd ..
    pause & exit /b 1
)
cd ..
echo [OK] Backend build successful

:: ── 7. Install frontend deps if needed ───────────────────────────────────
if not exist "frontend-react\node_modules" (
    echo [NPM] Installing frontend dependencies...
    cd frontend-react
    call npm install
    cd ..
    echo [OK] Frontend dependencies installed
) else (
    echo [OK] Frontend dependencies present
)

:: ── 8. Start all services in separate windows ────────────────────────────
echo.
echo [START] Launching services...

start "KSR Auth :8081" cmd /k "title KSR Auth-Service :8081 && color 0B && set JAVA_HOME=C:\Users\Lenovo\anaconda3\Library\lib\jvm && set PATH=%%JAVA_HOME%%\bin;%%PATH%% && echo Starting Auth Service on port 8081... && java -jar backend\auth-service\target\auth-service-1.0.0.jar"

echo [WAIT] Waiting 10s for Auth service to initialize...
timeout /t 10 /nobreak >nul

start "KSR Product :8082" cmd /k "title KSR Product-Service :8082 && color 0E && set JAVA_HOME=C:\Users\Lenovo\anaconda3\Library\lib\jvm && set PATH=%%JAVA_HOME%%\bin;%%PATH%% && echo Starting Product Service on port 8082... && java -jar backend\product-service\target\product-service-1.0.0.jar"

start "KSR Cart :8083" cmd /k "title KSR Cart-Service :8083 && color 0D && set JAVA_HOME=C:\Users\Lenovo\anaconda3\Library\lib\jvm && set PATH=%%JAVA_HOME%%\bin;%%PATH%% && echo Starting Cart Service on port 8083... && java -jar backend\cart-service\target\cart-service-1.0.0.jar"

start "KSR Order :8084" cmd /k "title KSR Order-Service :8084 && color 09 && set JAVA_HOME=C:\Users\Lenovo\anaconda3\Library\lib\jvm && set PATH=%%JAVA_HOME%%\bin;%%PATH%% && echo Starting Order Service on port 8084... && java -jar backend\order-service\target\order-service-1.0.0.jar"

echo [WAIT] Waiting 20s for all backend services to start...
timeout /t 20 /nobreak >nul

start "KSR Frontend :5173" cmd /k "title KSR Frontend :5173 && color 0A && cd frontend-react && echo Starting React frontend... && npm run dev"

:: ── 9. Done ───────────────────────────────────────────────────────────────
echo.
echo  ============================================================
echo    All services started!
echo  ============================================================
echo.
echo    Frontend   :  http://localhost:5173
echo    Auth API   :  http://localhost:8081
echo    Product    :  http://localhost:8082
echo    Cart       :  http://localhost:8083
echo    Order      :  http://localhost:8084
echo    Database   :  ksrfruits @ localhost:3306
echo.
echo    User App   :  http://localhost:5173/home
echo    Admin      :  http://localhost:5173/admin-login
echo.
echo    Admin email: ksrfruitshelp@gmail.com
echo  ============================================================
echo.
echo  Press any key to close this launcher window.
echo  (All service windows will keep running)
pause >nul
