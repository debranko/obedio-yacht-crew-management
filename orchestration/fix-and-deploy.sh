#!/bin/bash

##############################################
# Quick Fix and Deploy for NUC
# Use this when you've pulled latest changes
##############################################

set -e

echo "=========================================="
echo "  Quick Fix & Rebuild"
echo "=========================================="
echo ""

# Stop containers
echo "Stopping containers..."
docker compose -f docker-compose.prod.yml down

# Clean build cache
echo "Cleaning Docker build cache..."
docker builder prune -f

# Rebuild without cache
echo "Rebuilding from scratch..."
docker compose -f docker-compose.prod.yml build --no-cache

# Start services
echo "Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait and show status
sleep 5
echo ""
echo "=========================================="
echo "  Status"
echo "=========================================="
docker compose -f docker-compose.prod.yml ps

echo ""
echo "Check logs with:"
echo "  docker logs obedio-backend -f"
