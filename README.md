# Weave DB Lease VS Code Extension

This extension helps Weave developers generate bart database lease request commands directly from .weave.yaml files in service repositories.

Instead of manually inspecting configs, you can select a repo and environment in VS Code and get the correct command ready to run or copy.

## Features

- Lists repositories from a GitHub organization

- Fetches .weave.yaml from the selected repo (no local clone required)

- Lets you select the environment (dev, prod, etc.)

- Extracts hostname, database, and schema from the YAML

- Generates the bart database lease request command

- Option to copy the command to clipboard or run it in a VS Code terminal

- Uses gh auth for authentication (no tokens are stored in settings)

# Setup
## Prerequisites
```bash
Node.js (LTS recommended)
VS Code
GitHub CLI
```
Authenticate with GitHub CLI once:
```bash
gh auth login
```

## Install dependencies

```bash
npm install
```

## Compile

```bash 
npm run compile
```

## Run in development mode

Press F5 in VS Code. This opens a new "Extension Development Host" window.
From the Command Palette (Ctrl+Shift+P or Cmd+Shift+P), run:
``` Weave: Generate Lease Command```

# Usage

- Run ```Weave: Generate Lease Command``` from the Command Palette

- Select a repository from the `weave-lab` organization

- Select the environment defined in `.weave.yaml`

The extension generates a command such as:

```bash
bart database lease request -i wsf-dev-0:us-west4:pgsql-west4-dev0-1a -d commx -s sms_data
```

# NOTES

To package a .vsix for local install:

```bash
npm install -g @vscode/vsce
vsce package --allow-missing-repository
```

Then install it with:
```bash
code --install-extension weave-db-lease-x.y.z.vsix --force
```