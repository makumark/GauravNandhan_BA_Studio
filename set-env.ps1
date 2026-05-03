$db = "postgresql://neondb_owner:npg_T8HcNgjl5ALB@ep-summer-wave-a4d82xu2.us-east-1.aws.neon.tech/neondb?sslmode=require"
$gemini = "AIzaSyA4h5ys4oyyDAQDQ32FblLdVjRK9mmhocc"
$secret = "bAstudI0S3cr3t2026!@#"
$url = "https://gaurav-nandhan-ba-studio.vercel.app"

npx vercel env add DATABASE_URL production --value $db --yes
npx vercel env add GEMINI_API_KEY production --value $gemini --yes
npx vercel env add NEXTAUTH_SECRET production --value $secret --yes
npx vercel env add NEXTAUTH_URL production --value $url --yes

npx vercel deploy --prod --yes
