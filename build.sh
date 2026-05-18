#!/bin/bash
set -e

echo "=== Transit Pro — Render Build ==="

# 1. Install root-level dependencies
echo "Step 1: Installing root dependencies..."
npm install --include=dev

# 2. Install ALL API dependencies (critical — includes nodemailer, bcrypt, socket.io etc.)
echo "Step 2: Installing API dependencies..."
cd apps/api
npm install --include=dev

# 3. Force Prisma v5 (v7 breaks standard DATABASE_URL usage)
echo "Step 3: Pinning Prisma v5..."
npm install prisma@5.22.0 @prisma/client@5.22.0 --save --legacy-peer-deps

# 4. Write .env for runtime
echo "Step 4: Writing .env..."
DB_URL="${DATABASE_URL:-postgresql://postgres.hqbhcxgccvlsdrqnljbp:HettieBells0!2345@aws-1-eu-north-1.pooler.supabase.com:5432/postgres}"
printf 'DATABASE_URL=%s\n' "$DB_URL" > .env
printf 'JWT_SECRET=%s\n' "${JWT_SECRET:-super-secret-jwt-key-for-production}" >> .env
printf 'GOOGLE_MAPS_API_KEY=%s\n' "${GOOGLE_MAPS_API_KEY:-}" >> .env
echo "DATABASE_URL written (first 40 chars): ${DB_URL:0:40}..."

# 5. Generate Prisma Client
echo "Step 5: Generating Prisma Client..."
npx prisma generate

# 6. Build NestJS
echo "Step 6: Building NestJS API..."
npm run build

echo "=== Build complete — ready for production ==="
