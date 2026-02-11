# PowerShell script to create .env file for CourseCity

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CourseCity .env File Creator" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Generate secrets
Write-Host "Generating secure secrets..." -ForegroundColor Yellow
$SESSION_SECRET = node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
$JWT_SECRET = node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

Write-Host ""
Write-Host "✅ Secrets generated successfully!" -ForegroundColor Green
Write-Host ""

# Create .env content
$envContent = @"
# Database Configuration
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=coursecity

# Server Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=$SESSION_SECRET
JWT_SECRET=$JWT_SECRET

# OAuth - Google
# Get these from: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE

# OAuth - Facebook (Optional)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Frontend URL
FRONTEND_URL=http://localhost
"@

# Check if .env already exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Cancelled. No changes made." -ForegroundColor Red
        exit
    }
}

# Write .env file
try {
    $envContent | Out-File -FilePath ".env" -Encoding utf8 -NoNewline
    Write-Host "✅ .env file created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Next Steps:" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Open .env file and add your Google OAuth credentials" -ForegroundColor White
    Write-Host "2. Get credentials from: https://console.cloud.google.com/" -ForegroundColor White
    Write-Host "3. See: setup-google-auth.md for detailed instructions" -ForegroundColor White
    Write-Host ""
    Write-Host "Redirect URI to configure in Google Console:" -ForegroundColor Yellow
    Write-Host "  http://localhost:5000/api/auth/google/callback" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error creating .env file: $_" -ForegroundColor Red
    exit 1
}

