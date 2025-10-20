#!/bin/bash
# Setup script for creating .env file

echo "Creating .env file..."

if [ -f .env ]; then
    echo ".env file already exists!"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

cat > .env << 'EOF'
# Obedio Yacht Crew Management - Environment Configuration

# ===== DATABASE CONFIGURATION =====
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/obedio_yacht_crew"

# ===== SERVER CONFIGURATION =====
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# ===== FRONTEND CONFIGURATION =====
FRONTEND_URL=http://localhost:3000

# ===== AUTHENTICATION =====
JWT_SECRET=obedio-yacht-crew-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# ===== SECURITY =====
BCRYPT_ROUNDS=10

# ===== CORS =====
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# ===== LOGGING =====
LOG_LEVEL=info
EOF

echo ""
echo "✅ .env file created successfully!"
echo ""
echo "⚠️  IMPORTANT: Update the DATABASE_URL with your PostgreSQL credentials"
echo "   Current: postgresql://postgres:postgres@localhost:5432/obedio_yacht_crew"
echo ""
echo "📝 Edit .env file to customize settings before starting the server."
echo ""
