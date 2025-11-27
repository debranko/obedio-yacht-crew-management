#!/bin/bash

##############################################################################
# RESEED DEMO DATA
# Clears and reseeds database with full demo data including devices
##############################################################################

set -e  # Exit on error

echo "=========================================="
echo "  OBEDIO - Reseed Demo Data"
echo "=========================================="
echo ""

# Check if we're in Docker environment
if [ -f /.dockerenv ]; then
    echo "🐳 Running inside Docker container"
    IS_DOCKER=true
else
    echo "💻 Running on host system"
    IS_DOCKER=false
fi

# Warning
echo "⚠️  WARNING: This will:"
echo "   - Delete ALL existing data (guests, locations, service requests, devices)"
echo "   - Keep user accounts (admin/crew)"
echo "   - Reseed with fresh demo data including smart button devices"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted"
    exit 1
fi

echo ""
echo "🗑️  Clearing existing data..."

# Run the full seed script
echo "🌱 Running full seed script..."
if [ "$IS_DOCKER" = true ]; then
    node prisma/seed-full.js
else
    # On host, run in backend container
    docker exec obedio-backend node prisma/seed-full.js
fi

echo ""
echo "✅ Demo data reseeded successfully!"
echo ""
echo "📊 Your database now has:"
echo "   - Locations (cabins, common areas)"
echo "   - Demo guests"
echo "   - Crew members"
echo "   - Smart button devices for each cabin"
echo "   - Device logs"
echo ""
echo "🔧 You can now:"
echo "   - Use button simulator to test service requests"
echo "   - View devices in Device Manager"
echo "   - Assign devices to locations/crew"
echo ""
