#!/bin/bash

echo "========================================"
echo " OBEDIO YACHT CREW - COMPLETE SETUP"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js detected:"
node --version
echo ""

# Check if PostgreSQL is available
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL CLI detected:"
    psql --version
else
    echo "⚠️  PostgreSQL CLI not found in PATH"
    echo "   Make sure PostgreSQL is installed and running"
fi

echo ""
echo "========================================"
echo " STEP 1: Setup Backend"
echo "========================================"
echo ""

cd backend

# Create .env file
if [ ! -f .env ]; then
    echo "Creating .env file..."
    bash setup-env.sh
else
    echo "✅ .env file already exists"
fi

echo ""
echo "Installing backend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo ""
echo "Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi

echo ""
echo "Pushing database schema..."
npx prisma db push
if [ $? -ne 0 ]; then
    echo "❌ Failed to push database schema"
    echo "   Make sure PostgreSQL is running and DATABASE_URL in .env is correct"
    exit 1
fi

echo ""
echo "Seeding database with mock data..."
npm run db:seed
if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

cd ..

echo ""
echo "========================================"
echo " STEP 2: Setup Frontend"
echo "========================================"
echo ""

echo "Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo ""
echo "========================================"
echo " ✅ SETUP COMPLETE!"
echo "========================================"
echo ""
echo "🚀 To start the application:"
echo ""
echo "   1. Start Backend (in this terminal):"
echo "      cd backend && npm run dev"
echo ""
echo "   2. Start Frontend (in new terminal):"
echo "      npm run dev"
echo ""
echo "🔑 Login Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Health:   http://localhost:3001/api/health"
echo ""
