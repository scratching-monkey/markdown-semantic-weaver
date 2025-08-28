# Markdown Semantic Weaver - Development Container

This directory contains the configuration for the Visual Studio Code Development Container used for this project. The dev container provides a consistent, reproducible, and fully-equipped development environment for all contributors.

## Overview

The dev container is designed to streamline the development process for the "Markdown Semantic Weaver" VS Code extension. It includes all necessary system dependencies, Node.js packages, and VS Code extensions pre-installed, eliminating the need for manual setup.

## Included Components

### Base Image

- **`mcr.microsoft.com/vscode/devcontainers/typescript-node:1-20-bullseye`**: The container is built on an official Microsoft base image, which provides a foundation with Node.js v20 and TypeScript, optimized for VS Code development.

### System-Level Dependencies (`Dockerfile`)

The `Dockerfile` installs several essential tools and libraries:

- **Build & Debug Tools**: `curl`, `wget`, `jq` for general-purpose scripting and debugging.
- **VS Code Test Runner Dependencies**: A set of `lib*` packages and `xvfb` required to run the VS Code extension integration tests in a headless environment.
- **Docker CLI**: `docker.io` is installed to allow interaction with the Docker daemon from within the container.

### VS Code Features (`devcontainer.json`)

The `devcontainer.json` file enables several pre-built features to enhance the environment:

- **`docker-outside-of-docker`**: Allows the container to securely communicate with the host's Docker daemon.
- **`git`**: Installs the latest version of Git.
- **`github-cli`**: Installs the GitHub CLI for interacting with repositories.
- **`dotnet`**: Installs the .NET SDK.

### VS Code Customizations (`devcontainer.json`)

- **Extensions**: A curated list of extensions is automatically installed to ensure a consistent and productive workflow. This includes:
  - `dbaeumer.vscode-eslint` & `esbenp.prettier-vscode`: For linting and code formatting.
  - `Orta.vscode-jest` & `hbenl.vscode-mocha-test-adapter`: For running and debugging tests.
  - `GitHub.copilot` & `GitHub.copilot-chat`: For AI-assisted development.
  - And others for TypeScript, JSON, and YAML support.
- **Settings**: The editor is pre-configured with settings to:
  - Format code on save.
  - Enable ESLint auto-fixing.
  - Set `/bin/bash` as the default terminal shell.

## Getting Started

1.  **Prerequisites**: You must have [Docker Desktop](https://www.docker.com/products/docker-desktop/) and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) installed in VS Code.
2.  **Open the Project**: Open this repository in VS Code.
3.  **Reopen in Container**: VS Code will detect the `.devcontainer` configuration and prompt you to "Reopen in Container". Click it.
4.  **Wait for Build**: The first time you open it, Docker will build the container image. This may take a few minutes. Subsequent launches will be much faster.
5.  **Ready to Code**: Once the container is running, VS Code will connect to it. The `postCreateCommand` will automatically run `npm install`, and you'll be ready to start developing.

## Key Configurations

### `postCreateCommand`

- **`npm install`**: This command runs automatically after the container is created. It installs all the Node.js dependencies listed in `package.json`, so you don't have to do it manually.

### `mounts`

To provide a seamless development experience, the container mounts several configuration files and directories from your local machine into the container. This ensures that your personal settings for Git, SSH, and the GitHub CLI are available inside the container.

- **SSH Keys**: Your `~/.ssh` directory is mounted, allowing you to use your existing SSH keys for Git operations (e.g., `git push`/`pull`).
- **Git Config**: Your `~/.gitconfig` is mounted, so your Git user name, email, and other preferences are preserved.
- **GitHub CLI Config**: Your `~/.config/gh` directory is mounted, so you remain logged into the GitHub CLI.
