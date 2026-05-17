#!/bin/bash
set -e

echo "Running complete monorepo setup for Render..."

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
