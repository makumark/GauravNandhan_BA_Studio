# Use this script to trigger a production deployment.
# Environment variables should be managed in the Vercel Dashboard (Settings > Environment Variables)
# to prevent sensitive keys from being leaked in chat or scripts.

npx vercel deploy --prod --yes
