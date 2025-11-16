#!/bin/sh
set -e

echo "🚀 Starting Obedio Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
until nc -z db 5432; do
  echo "Database is unavailable - sleeping"
  sleep 1
done
echo "✅ Database is ready!"

# Run migrations or push schema
echo "🔄 Setting up database schema..."
if npx prisma migrate deploy 2>&1 | grep -q "No migration found"; then
  echo "📦 No migrations found, pushing schema directly..."
  npx prisma db push --skip-generate
else
  echo "✅ Migrations applied"
fi

# Generate Prisma Client (in case it's not already generated)
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Seed database if needed (only on first run)
echo "🌱 Seeding database (if needed)..."
npx prisma db seed || echo "ℹ️  Seed skipped (already seeded or no seed script)"

echo "✅ Backend ready! Starting server..."

# Start the application
exec node dist/server.js
