$env:DATABASE_URL="postgresql://neondb_owner:npg_T8HcNgjl5ALB@ep-summer-wave-a4d82xu2.us-east-1.aws.neon.tech/neondb?sslmode=require"
$env:GEMINI_API_KEY="AIzaSyA4h5ys4oyyDAQDQ32FblLdVjRK9mmhocc"
$env:NEXTAUTH_SECRET="bAstudI0S3cr3t2026!@#"
$env:NEXTAUTH_URL="https://gaurav-nandhan-ba-studio.vercel.app"

npx vercel deploy --prod --yes `
  -b DATABASE_URL=$env:DATABASE_URL -e DATABASE_URL=$env:DATABASE_URL `
  -b GEMINI_API_KEY=$env:GEMINI_API_KEY -e GEMINI_API_KEY=$env:GEMINI_API_KEY `
  -b NEXTAUTH_SECRET=$env:NEXTAUTH_SECRET -e NEXTAUTH_SECRET=$env:NEXTAUTH_SECRET `
  -b NEXTAUTH_URL=$env:NEXTAUTH_URL -e NEXTAUTH_URL=$env:NEXTAUTH_URL
