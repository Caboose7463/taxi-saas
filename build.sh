#!/bin/bash
set -e

echo "Running complete monorepo setup for Render..."

# Ensure DATABASE_URL is set to the correct pooler URL
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres.hqbhcxgccvlsdrqnljbp:HettieBells0%212345@aws-1-eu-north-1.pooler.supabase.com:5432/postgres}"
echo "DATABASE_URL is set."

# Write .env file for runtime (NestJS picks this up via dotenv)
echo "DATABASE_URL=$DATABASE_URL" > apps/api/.env
echo "JWT_SECRET=${JWT_SECRET:-super-secret-jwt-key-for-production}" >> apps/api/.env
echo "GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY:-}" >> apps/api/.env
echo "Written .env file for runtime."

# 1. Install all dependencies (including dev tools like typescript, ts-node, nestjs/cli)
echo "Installing root dependencies..."
npm install --include=dev

# 2. Force local installation of problematic hoisted modules
echo "Forcing local module resolution for Prisma..."
cd apps/api
npm install dotenv ts-node typescript @prisma/config

# 3. Generate Prisma Types
echo "Generating Prisma Client..."
npx prisma generate

# 4. Build NestJS Backend
echo "Building NestJS API..."
npm run build

echo "Build complete! Ready for production start."
