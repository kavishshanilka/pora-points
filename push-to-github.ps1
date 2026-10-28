# Push to GitHub Pages Script
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "🔥 Deploying Pora Points to GitHub..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Yellow

# Check git status
git status

# Push to origin main
Write-Host "`nPushing code to https://github.com/kavishshanilka/pora-points.git..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Code pushed successfully!" -ForegroundColor Green
    Write-Host "Now go to GitHub repository Settings -> Pages and ensure Deploy from branch 'main' is enabled." -ForegroundColor Cyan
    Write-Host "Live Website URL: https://kavishshanilka.github.io/pora-points/`n" -ForegroundColor Green
} else {
    Write-Host "`n[NOTE] If the repository does not exist yet on GitHub:" -ForegroundColor Yellow
    Write-Host "1. Open https://github.com/new in your browser" -ForegroundColor White
    Write-Host "2. Name it 'pora-points' (Public)" -ForegroundColor White
    Write-Host "3. Click 'Create repository' (Do NOT check initialize with README)" -ForegroundColor White
    Write-Host "4. Re-run this script: .\push-to-github.ps1`n" -ForegroundColor Cyan
}
