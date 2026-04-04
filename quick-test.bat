@echo off
echo ========================================
echo Quick Test - KSR Fruits Application
echo ========================================
echo.

echo Testing Auth Service...
cd backend\auth-service
call mvn test -Dtest=AuthServiceTest -q
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Auth Service tests failed
    cd ..\..
    pause
    exit /b 1
)
echo ✓ Auth Service tests passed
cd ..\..

echo.
echo Testing Cart Service...
cd backend\cart-service
call mvn test -Dtest=CartServiceTest -q
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Cart Service tests failed
    cd ..\..
    pause
    exit /b 1
)
echo ✓ Cart Service tests passed
cd ..\..

echo.
echo Testing Product Service...
cd backend\product-service
call mvn test -Dtest=ProductServiceTest -q
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Product Service tests failed
    cd ..\..
    pause
    exit /b 1
)
echo ✓ Product Service tests passed
cd ..\..

echo.
echo ========================================
echo ✓ ALL QUICK TESTS PASSED!
echo ========================================
echo.
echo Run 'run-tests.bat' for comprehensive testing
echo.
pause
