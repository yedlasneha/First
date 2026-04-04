@echo off
echo ========================================
echo KSR Fruits - Comprehensive Test Suite
echo ========================================
echo.

echo [1/5] Running Unit Tests...
echo ========================================
cd backend
call mvn clean test -q
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Unit tests failed!
    pause
    exit /b 1
)
echo ✓ Unit tests passed
echo.

echo [2/5] Running Integration Tests...
echo ========================================
call mvn verify -DskipUnitTests -q
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Integration tests failed!
    pause
    exit /b 1
)
echo ✓ Integration tests passed
echo.

echo [3/5] Building Backend Services...
echo ========================================
call mvn clean install -DskipTests -q
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend build failed!
    pause
    exit /b 1
)
echo ✓ Backend build successful
echo.

echo [4/5] Building Frontend...
echo ========================================
cd ../frontend-react
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
echo ✓ Frontend build successful
echo.

echo [5/5] Generating Test Report...
echo ========================================
cd ../backend
call mvn surefire-report:report -q
echo ✓ Test report generated at: backend/target/site/surefire-report.html
echo.

echo ========================================
echo ✓ ALL TESTS PASSED SUCCESSFULLY!
echo ========================================
echo.
echo Application is ready for containerization.
echo.
echo Next steps:
echo 1. Review test reports in backend/target/site/
echo 2. Test APIs using Postman collection
echo 3. Perform manual frontend testing
echo 4. Proceed with Docker containerization
echo.
pause
