#!/bin/bash

echo "========================================"
echo " PUSH TO GITHUB - Obedio Yacht Crew"
echo "========================================"
echo ""

# GitHub repository
REPO_URL="https://github.com/debranko/obedio-yacht-crew-management.git"

echo "Repository: $REPO_URL"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed!"
    echo "   Please install Git from https://git-scm.com"
    exit 1
fi

echo "✅ Git detected"
echo ""

# Check if .git exists
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    git branch -M main
    echo "✅ Git initialized"
    echo ""
fi

# Check if remote exists
if ! git remote get-url origin &> /dev/null; then
    echo "🔗 Adding remote repository..."
    git remote add origin "$REPO_URL"
    echo "✅ Remote added"
    echo ""
else
    echo "✅ Remote already configured"
    echo ""
fi

# Check .gitignore
if [ ! -f .gitignore ]; then
    echo "⚠️  .gitignore not found!"
    echo "   Creating default .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*/node_modules/

# Build outputs
dist/
build/
*/dist/
*/build/

# Environment files
.env
.env.local
.env.production
backend/.env

# Logs
logs/
*.log
EOF
    echo "✅ .gitignore created"
    echo ""
fi

echo "📊 Current status:"
git status
echo ""

echo "========================================"
echo ""
echo "Ready to commit and push!"
echo ""
echo "⚠️  IMPORTANT: Make sure you have:"
echo "   1. Removed any sensitive data (.env files)"
echo "   2. Tested the application locally"
echo "   3. Updated documentation"
echo ""

read -p "Do you want to continue with commit and push? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "❌ Push cancelled"
    exit 0
fi

echo ""
echo "📦 Adding all files..."
git add .

echo ""
read -p "Enter commit message (or press Enter for default): " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Initial commit - Complete Obedio Yacht Crew Management System"
fi

echo ""
echo "📝 Committing with message: \"$COMMIT_MSG\""
git commit -m "$COMMIT_MSG"

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Nothing to commit or commit failed"
    echo "   Check git status for more info"
    exit 1
fi

echo ""
echo "🚀 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo " ✅ SUCCESSFULLY PUSHED TO GITHUB!"
    echo "========================================"
    echo ""
    echo "🌐 Repository: $REPO_URL"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Visit your GitHub repository"
    echo "   2. Check that all files are there"
    echo "   3. Update repository description"
    echo "   4. Add topics/tags"
    echo ""
else
    echo ""
    echo "❌ Push failed!"
    echo ""
    echo "Possible reasons:"
    echo "   - Not authenticated with GitHub"
    echo "   - Network issue"
    echo "   - Repository doesn't exist"
    echo ""
    echo "💡 Try:"
    echo "   git push -u origin main"
    echo ""
fi
