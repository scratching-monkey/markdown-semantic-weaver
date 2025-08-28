# Use the official VS Code TypeScript Node.js dev container as base
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:1-20-bullseye

# Install additional tools that might be useful for VS Code extension development
RUN npm install -g yo generator-code @vscode/vsce

# Install additional development dependencies
RUN apt-get update && apt-get install -y \
    # For potential debugging and development
    curl \
    wget \
    jq \
    # For Git operations
    git \
    # For Docker-from-Docker setup
    docker.io \
    # Required libraries for VS Code test runner
    libnspr4 \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    libxrandr2 \
    libasound2-dev \
    libatspi2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxss1 \
    libgconf-2-4 \
    libgtk-3-0 \
    libgbm1 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Set up proper permissions for the node user to access Docker
RUN usermod -aG docker node

# Switch to the node user for security
USER node

# Create a workspace directory
WORKDIR /workspace