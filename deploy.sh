#!/bin/bash
echo "🚀 Preparing to deploy Taxi SaaS Platform..."

# Build the entire monorepo to ensure no errors
echo "📦 Building Monorepo..."
npm run build

echo "🌐 Deploying Frontend to Vercel..."
cd apps/frontend
vercel --prod

echo "✅ Frontend Deployed!"
echo ""
echo "Next Steps for Backend API (NestJS):"
echo "1. Provision a DigitalOcean Droplet with Node.js."
echo "2. Clone this repo to the droplet."
echo "3. Run 'npm install' and 'npm run build' inside apps/api."
echo "4. Use 'pm2 start dist/main.js' to keep the server running."
