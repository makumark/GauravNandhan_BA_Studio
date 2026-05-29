# Use this script to trigger a production deployment.
# Environment variables should be managed in the Vercel Dashboard (Settings > Environment Variables)
# to prevent sensitive keys from being leaked in chat or scripts.

# Environment variables are managed in the Vercel Dashboard (Settings > Environment Variables).
# NEVER hardcode secrets here. Set them once in the Vercel Dashboard and they persist across deploys.
npx vercel deploy --prod --yes
