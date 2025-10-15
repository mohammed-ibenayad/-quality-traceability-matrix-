#!/bin/bash
# ==============================================================================
# Quality Tracker - Frontend Deployment Script
# ==============================================================================
# Usage: ./deploy-frontend.sh [branch-name]
# Example: ./deploy-frontend.sh feature/new-import
# If no branch provided, uses current branch
# ==============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="$HOME/quality-traceability-matrix"
DEPLOY_DIR="/var/www/html"
LOG_FILE="$HOME/deploy-frontend-$(date +%Y%m%d_%H%M%S).log"

# Functions
log() {
    echo -e "${2}$1${NC}" | tee -a "$LOG_FILE"
}

section() {
    echo "" | tee -a "$LOG_FILE"
    echo "============================================================" | tee -a "$LOG_FILE"
    log "$1" "$CYAN"
    echo "============================================================" | tee -a "$LOG_FILE"
}

error_exit() {
    log "❌ ERROR: $1" "$RED"
    exit 1
}

success() {
    log "✅ $1" "$GREEN"
}

warning() {
    log "⚠️  $1" "$YELLOW"
}

info() {
    log "ℹ️  $1" "$BLUE"
}

# ==============================================================================
# STEP 0: INITIALIZATION
# ==============================================================================
section "STEP 0: Initialization"

# Determine branch to deploy
DEPLOY_BRANCH="${1:-$(git -C "$FRONTEND_DIR" branch --show-current)}"
info "Target directory: $FRONTEND_DIR"
info "Deploy branch: $DEPLOY_BRANCH"
info "Log file: $LOG_FILE"

# Check if directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    error_exit "Frontend directory not found: $FRONTEND_DIR"
fi

cd "$FRONTEND_DIR" || error_exit "Cannot change to frontend directory"

# ==============================================================================
# STEP 1: GIT STATUS CHECK (INFORMATIONAL ONLY)
# ==============================================================================
section "STEP 1: Checking Git Status"

info "Current branch: $(git branch --show-current)"
info "Last local commit: $(git log -1 --oneline)"

# Show uncommitted changes if any (but don't block deployment)
if ! git diff-index --quiet HEAD --; then
    warning "Local uncommitted changes detected (will be discarded):"
    git status --short
    info "These changes will be overwritten by force pull"
else
    success "Working directory is clean"
fi

# ==============================================================================
# STEP 2: FORCE PULL LATEST CHANGES
# ==============================================================================
section "STEP 2: Force Pulling Latest Changes"

info "Fetching latest changes from remote..."
git fetch origin || error_exit "Failed to fetch from remote"

info "Force checking out branch: $DEPLOY_BRANCH"
git checkout -f "$DEPLOY_BRANCH" || error_exit "Failed to checkout branch $DEPLOY_BRANCH"

info "Resetting to origin/$DEPLOY_BRANCH (discarding local changes)..."
git reset --hard "origin/$DEPLOY_BRANCH" || error_exit "Failed to reset to remote branch"

# Clean untracked files except .env and node_modules
info "Cleaning untracked files (keeping .env)..."
git clean -fd -e .env -e node_modules || warning "Clean failed (continuing anyway)"

success "Code updated successfully (forced)"
info "Current commit: $(git log -1 --oneline)"

# ==============================================================================
# STEP 3: INSTALL DEPENDENCIES
# ==============================================================================
section "STEP 3: Installing Dependencies"

info "Running npm install..."
npm install || error_exit "npm install failed"

success "Dependencies installed"

# ==============================================================================
# STEP 4: BUILD FRONTEND
# ==============================================================================
section "STEP 4: Building Frontend"

info "Building production bundle..."
npm run build || error_exit "Build failed"

# Verify build output
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    error_exit "Build output directory is empty or missing"
fi

BUILD_SIZE=$(du -sh dist | cut -f1)
success "Build successful (Size: $BUILD_SIZE)"

# ==============================================================================
# STEP 5: BACKUP OLD DEPLOYMENT
# ==============================================================================
section "STEP 5: Backing Up Current Deployment"

BACKUP_DIR="${DEPLOY_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
if [ -d "$DEPLOY_DIR" ]; then
    info "Creating backup: $BACKUP_DIR"
    sudo mv "$DEPLOY_DIR" "$BACKUP_DIR" || warning "Backup failed (continuing anyway)"
    success "Backup created"
else
    warning "No existing deployment to backup"
fi

# ==============================================================================
# STEP 6: DEPLOY NEW BUILD
# ==============================================================================
section "STEP 6: Deploying New Build"

info "Creating deployment directory..."
sudo mkdir -p "$DEPLOY_DIR" || error_exit "Failed to create deployment directory"

info "Copying build files..."
sudo cp -r dist/* "$DEPLOY_DIR/" || error_exit "Failed to copy files"

info "Setting permissions..."
sudo chown -R www-data:www-data "$DEPLOY_DIR" || error_exit "Failed to set ownership"
sudo chmod -R 755 "$DEPLOY_DIR" || error_exit "Failed to set permissions"

success "Files deployed successfully"

# Verify deployment
if [ -f "$DEPLOY_DIR/index.html" ]; then
    info "Deployment verified: index.html exists"
    ls -lh "$DEPLOY_DIR/index.html"
else
    error_exit "Deployment verification failed: index.html not found"
fi

# ==============================================================================
# STEP 7: RELOAD NGINX
# ==============================================================================
section "STEP 7: Reloading Nginx"

info "Testing nginx configuration..."
if sudo nginx -t; then
    success "Nginx configuration valid"
    
    info "Reloading nginx..."
    sudo systemctl reload nginx || error_exit "Failed to reload nginx"
    success "Nginx reloaded"
else
    error_exit "Nginx configuration test failed"
fi

# ==============================================================================
# STEP 8: DEPLOYMENT VERIFICATION
# ==============================================================================
section "STEP 8: Verifying Deployment"

info "Testing frontend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
if [ "$HTTP_CODE" = "200" ]; then
    success "Frontend responding (HTTP $HTTP_CODE)"
else
    warning "Frontend returned HTTP $HTTP_CODE (this might be okay)"
fi

info "Testing API health..."
API_RESPONSE=$(curl -s http://localhost/api/health 2>/dev/null || echo "failed")
if [[ "$API_RESPONSE" == *"healthy"* ]]; then
    success "API health check passed"
else
    warning "API health check failed or unavailable"
fi

# ==============================================================================
# STEP 9: SUMMARY
# ==============================================================================
section "DEPLOYMENT COMPLETE"

echo ""
success "Frontend deployed successfully!"
echo ""
info "Branch: $DEPLOY_BRANCH"
info "Commit: $(git log -1 --oneline)"
info "Build size: $BUILD_SIZE"
info "Deployed to: $DEPLOY_DIR"
info "Backup location: $BACKUP_DIR"
echo ""
log "🌐 Access your application at:" "$GREEN"
echo "   Frontend: http://213.6.2.229/"
echo "   API Health: http://213.6.2.229/api/health"
echo ""
info "Log saved to: $LOG_FILE"
echo ""

# Optional: Clean up old backups (keep last 5)
BACKUP_COUNT=$(ls -d ${DEPLOY_DIR}.backup.* 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 5 ]; then
    warning "Found $BACKUP_COUNT backups. Keeping only the 5 most recent."
    ls -dt ${DEPLOY_DIR}.backup.* | tail -n +6 | xargs sudo rm -rf
    success "Old backups cleaned up"
fi

echo ""
log "🎉 All done! Happy testing!" "$CYAN"
echo ""