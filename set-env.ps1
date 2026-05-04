# Load environment variables from .env.local
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^(.*?)=(.*)$') {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim().Trim('"')
            if ($key -eq "GEMINI_API_KEY") { $gemini = $val }
            if ($key -eq "DATABASE_URL") { $db = $val }
            if ($key -eq "NEXTAUTH_SECRET") { $secret = $val }
        }
    }
}

$url = "https://gaurav-nandhan-ba-studio.vercel.app"

Write-Host "Force-Resetting Production Environment..." -ForegroundColor Cyan

# Remove old keys first to be absolutely sure
npx vercel env rm GEMINI_API_KEY production --yes 2>$null
npx vercel env rm DATABASE_URL production --yes 2>$null

# Add fresh keys
npx vercel env add DATABASE_URL production --value $db --yes
npx vercel env add GEMINI_API_KEY production --value $gemini --yes
npx vercel env add NEXTAUTH_SECRET production --value $secret --yes
npx vercel env add NEXTAUTH_URL production --value $url --yes

Write-Host "Deploying Fresh Build..." -ForegroundColor Green
npx vercel deploy --prod --force --yes
