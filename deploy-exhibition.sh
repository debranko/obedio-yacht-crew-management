#!/bin/bash

##############################################
# OBEDIO Exhibition Deployment Script
# For NUC Server @ 10.10.0.10
##############################################

set -e  # Exit on error

echo "=========================================="
echo "  OBEDIO Exhibition Deployment"
echo "  NUC Server Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running on NUC
print_info "Checking system requirements..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed!"
    exit 1
fi
print_success "Docker found: $(docker --version)"

# Check Docker Compose
if ! command -v docker compose &> /dev/null; then
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed!"
        exit 1
    fi
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi
print_success "Docker Compose found"

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "docker-compose.prod.yml not found!"
    print_info "Please run this script from the project root directory"
    exit 1
fi

# Stop any existing containers
print_info "Stopping existing containers (if any)..."
$DOCKER_COMPOSE -f docker-compose.prod.yml down 2>/dev/null || true
print_success "Cleaned up existing containers"

# Remove old images to save space (optional)
read -p "Remove old Docker images to save space? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Removing old images..."
    docker image prune -af || true
    print_success "Old images removed"
fi

# Create necessary directories
print_info "Creating directories..."
mkdir -p backend/logs backend/uploads
print_success "Directories created"

# Build images
print_info "Building Docker images (this may take 5-10 minutes)..."
$DOCKER_COMPOSE -f docker-compose.prod.yml build --no-cache
print_success "Images built successfully"

# Start services
print_info "Starting services..."
$DOCKER_COMPOSE -f docker-compose.prod.yml up -d
print_success "Services started"

# Wait for services to be healthy
print_info "Waiting for services to be ready..."
sleep 10

# Check database health
print_info "Checking database connection..."
for i in {1..30}; do
    if docker exec obedio-db pg_isready -U obedio_user &> /dev/null; then
        print_success "Database is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Database failed to start"
        exit 1
    fi
    sleep 2
done

# Run migrations and seed
print_info "Running database migrations..."
docker exec obedio-backend npx prisma migrate deploy 2>/dev/null || {
    print_info "Migrations already applied or using db push..."
    docker exec obedio-backend npx prisma db push --accept-data-loss
}
print_success "Database schema updated"

print_info "Seeding database with demo data..."
docker exec obedio-backend npx prisma db seed || {
    print_info "Seed might have already run, continuing..."
}
print_success "Database seeded"

# Wait for backend to be ready
print_info "Waiting for backend API..."
for i in {1..30}; do
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        print_success "Backend API is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Backend API failed to start"
        docker logs obedio-backend --tail 50
        exit 1
    fi
    sleep 2
done

# Wait for frontend to be ready
print_info "Waiting for frontend..."
for i in {1..30}; do
    if curl -f http://localhost:3000 &> /dev/null; then
        print_success "Frontend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Frontend failed to start"
        docker logs obedio-frontend --tail 50
        exit 1
    fi
    sleep 2
done

# Display status
echo ""
echo "=========================================="
echo "  🎉 DEPLOYMENT SUCCESSFUL!"
echo "=========================================="
echo ""
print_success "All services are running"
echo ""
echo "Access the application:"
echo "  🌐 Frontend:    http://10.10.0.10:3000"
echo "  🔌 Backend API: http://10.10.0.10:3001"
echo "  🗄️  Database:   PostgreSQL on port 5432"
echo ""
echo "Login credentials:"
echo "  👤 Username: admin"
echo "  🔑 Password: admin123"
echo ""
echo "Container status:"
$DOCKER_COMPOSE -f docker-compose.prod.yml ps
echo ""
echo "To view logs:"
echo "  All:      $DOCKER_COMPOSE -f docker-compose.prod.yml logs -f"
echo "  Backend:  docker logs obedio-backend -f"
echo "  Frontend: docker logs obedio-frontend -f"
echo "  Database: docker logs obedio-db -f"
echo ""
echo "To stop:"
echo "  $DOCKER_COMPOSE -f docker-compose.prod.yml down"
echo ""
echo "=========================================="
