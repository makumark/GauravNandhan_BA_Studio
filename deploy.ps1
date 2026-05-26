# Use this script to trigger a production deployment.
# Environment variables should be managed in the Vercel Dashboard (Settings > Environment Variables)
# to prevent sensitive keys from being leaked in chat or scripts.

npx vercel deploy --prod --yes -e GEMINI_API_KEY="AIzaSyC55dumzmSlDRDmwO9USw49NLVVdmH1iNg" -e DATABASE_URL="postgresql://neondb_owner:npg_T8HcNgjl5ALB@ep-summer-wave-a4d82xu2.us-east-1.aws.neon.tech/neondb?sslmode=require" -e NEXTAUTH_SECRET="bAstudI0S3cr3t2026!@#" -e NEXTAUTH_URL="https://gaurav-nandhan-ba-studio.vercel.app"
