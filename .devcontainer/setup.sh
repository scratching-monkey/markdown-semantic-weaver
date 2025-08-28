#!/bin/bash
# setup.sh - Configure user environment with host configs (cloud-init style)

set -e

echo "🔧 Setting up user environment from host..."

# Fix SSH permissions (critical for SSH keys to work)
if [ -d "$HOME/.ssh" ]; then
    echo "📝 Fixing SSH permissions..."
    chmod 700 "$HOME/.ssh"
    chmod 600 "$HOME/.ssh"/* 2>/dev/null || true
    chmod 644 "$HOME/.ssh"/*.pub 2>/dev/null || true
    chmod 644 "$HOME/.ssh/config" 2>/dev/null || true
    chmod 644 "$HOME/.ssh/known_hosts" 2>/dev/null || true
fi

# Set up Git if configuration exists
if [ -f "$HOME/.gitconfig" ]; then
    echo "📝 Git configuration found and mounted"
    git config --list --show-origin | head -5
else
    echo "⚠️  No .gitconfig found, setting up basic config..."
    # Fallback git configuration
    git config --global user.name "Container User"
    git config --global user.email "user@container.local"
    git config --global init.defaultBranch main
fi

# Source host bashrc if available
if [ -f "$HOME/.bashrc_host" ]; then
    echo "📝 Incorporating host bash configuration..."
    cat >> "$HOME/.bashrc" << 'EOF'

# Source host bashrc for aliases and functions
if [ -f ~/.bashrc_host ]; then
    source ~/.bashrc_host
fi
EOF
fi

# Set up GitHub CLI if configuration exists
if [ -d "$HOME/.config/gh" ]; then
    echo "📝 GitHub CLI configuration found and mounted"
fi

# Test GitHub connectivity
echo "🔍 Testing GitHub connectivity..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "✅ GitHub SSH authentication working!"
elif command -v gh &> /dev/null && gh auth status &>/dev/null; then
    echo "✅ GitHub CLI authentication working!"
else
    echo "⚠️  GitHub authentication not detected. You may need to:"
    echo "   1. Check SSH keys are mounted correctly"
    echo "   2. Run 'ssh-add' if needed"
    echo "   3. Or run 'gh auth login' for GitHub CLI"
fi

 npm install

 dotnet tool install --global minver-cli