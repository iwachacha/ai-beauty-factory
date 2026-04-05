# ==========================================
# SNS Factory - Start Script (PowerShell)
# ==========================================

Write-Host "Starting SNS Factory..." -ForegroundColor Cyan

Write-Host "[1/2] Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"cd backend; npm run serve:factory`"" -WindowStyle Normal

Write-Host "[3/3] Starting Frontend Web Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"cd web; npm run dev`"" -WindowStyle Normal

Write-Host "==========================================" -ForegroundColor Green
Write-Host "All tasks started successfully!" -ForegroundColor Green
Write-Host "Please wait a few seconds and then open your browser at:"
Write-Host "http://localhost:3000"
Write-Host "==========================================" -ForegroundColor Green
