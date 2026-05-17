#!/bin/bash
set -e

echo "Running complete monorepo setup for Render..."

# 1. Install all root dependencies (including dev tools)
echo "Installing root dependencies..."
npm install --include=dev

# 2. Move into the API directory and install specific deps
echo "Setting up API..."
cd apps/api
npm install dotenv ts-node typescript @prisma/config
# Force Prisma v5 (v7 requires driver adapters which break standard DATABASE_URL usage)
npm install prisma@5.22.0 @prisma/client@5.22.0 --save

# 3. Write .env file HERE (inside apps/api) for runtime
DB_URL="${DATABASE_URL:-postgresql://postgres.hqbhcxgccvlsdrqnljbp:HettieBells0!2345@aws-1-eu-north-1.pooler.supabase.com:5432/postgres}"
printf 'DATABASE_URL=%s\n' "$DB_URL" > .env
printf 'JWT_SECRET=%s\n' "${JWT_SECRET:-super-secret-jwt-key-for-production}" >> .env
printf 'GOOGLE_MAPS_API_KEY=%s\n' "${GOOGLE_MAPS_API_KEY:-}" >> .env
echo "Written .env to apps/api/.env"
cat .env | head -1  # Print first line to verify (without exposing full password)

# 4. Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# 5. Build NestJS Backend
echo "Building NestJS API..."
npm run build

echo "Build complete! Ready for production start."
