#!/bin/bash

##############################################
# OBEDIO Update Script
# Pull latest changes from Git and redeploy
##############################################

set -e  # Exit on error

echo "=========================================="
echo "  OBEDIO Update from Git"
echo "  Pulling latest changes..."
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

# Check Docker Compose command
if command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Show current version
print_step "Current Git status:"
git log -1 --pretty=format:"%h - %an, %ar : %s" || print_info "Not a git repository or no commits"
echo ""
echo ""

# Backup database before update
print_step "Creating database backup..."
BACKUP_FILE="backup_before_update_$(date +%Y%m%d_%H%M%S).sql"
docker exec obedio-db pg_dump -U obedio_user obedio_yacht_crew > "$BACKUP_FILE" 2>/dev/null || {
    print_info "Database backup skipped (containers might not be running)"
}
if [ -f "$BACKUP_FILE" ]; then
    print_success "Database backed up to: $BACKUP_FILE"
fi
echo ""

# Check for local changes
print_step "Checking for local modifications..."
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    print_info "You have local changes that are not committed:"
    git status --short
    echo ""
    read -p "Do you want to DISCARD local changes and pull from Git? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Discarding local changes..."
        git reset --hard HEAD
        git clean -fd
        print_success "Local changes discarded"
    else
        print_error "Update cancelled. Please commit or stash your changes first."
        exit 1
    fi
fi
echo ""

# Fetch latest changes
print_step "Fetching latest changes from GitHub..."
git fetch origin
echo ""

# Show what will be updated
print_step "Changes to be pulled:"
git log HEAD..origin/$(git branch --show-current) --oneline || print_info "Already up to date"
echo ""

read -p "Continue with update? (Y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    print_error "Update cancelled"
    exit 0
fi
echo ""

# Pull latest changes
print_step "Pulling latest code from GitHub..."
git pull origin $(git branch --show-current)
print_success "Code updated"
echo ""

# Show new version
print_step "New version:"
git log -1 --pretty=format:"%h - %an, %ar : %s"
echo ""
echo ""

# Stop containers
print_step "Stopping running containers..."
$DOCKER_COMPOSE -f docker-compose.prod.yml down
print_success "Containers stopped"
echo ""

# Rebuild and restart
print_step "Rebuilding Docker images with latest code..."
$DOCKER_COMPOSE -f docker-compose.prod.yml build --no-cache
print_success "Images rebuilt"
echo ""

print_step "Starting updated services..."
$DOCKER_COMPOSE -f docker-compose.prod.yml up -d
print_success "Services started"
echo ""

# Wait for services
print_step "Waiting for services to be ready..."
sleep 10

# Check database
for i in {1..30}; do
    if docker exec obedio-db pg_isready -U obedio_user &> /dev/null; then
        print_success "Database is ready"
        break
    fi
    sleep 2
done
echo ""

# Run migrations (in case schema changed)
print_step "Applying database migrations..."
docker exec obedio-backend npx prisma migrate deploy 2>/dev/null || {
    docker exec obedio-backend npx prisma db push --accept-data-loss
}
print_success "Database schema updated"
echo ""

# Check backend health
print_step "Checking backend API..."
for i in {1..30}; do
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        print_success "Backend API is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Backend API health check failed"
        print_info "Showing last 30 lines of backend logs:"
        docker logs obedio-backend --tail 30
        exit 1
    fi
    sleep 2
done
echo ""

# Check frontend
print_step "Checking frontend..."
for i in {1..30}; do
    if curl -f http://localhost:3000 &> /dev/null; then
        print_success "Frontend is healthy"
        break
    fi
    sleep 2
done
echo ""

# Final status
echo "=========================================="
echo "  🎉 UPDATE SUCCESSFUL!"
echo "=========================================="
echo ""
print_success "Application updated and running"
echo ""
echo "Access the application:"
echo "  🌐 Frontend:    http://10.10.0.10:3000"
echo "  🔌 Backend API: http://10.10.0.10:3001"
echo ""
echo "Login credentials:"
echo "  👤 Username: admin"
echo "  🔑 Password: admin123"
echo ""
echo "Container status:"
$DOCKER_COMPOSE -f docker-compose.prod.yml ps
echo ""
if [ -f "$BACKUP_FILE" ]; then
    echo "Database backup saved: $BACKUP_FILE"
    echo "To restore if needed: "
    echo "  docker exec -i obedio-db psql -U obedio_user obedio_yacht_crew < $BACKUP_FILE"
    echo ""
fi
echo "=========================================="
