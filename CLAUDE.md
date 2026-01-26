# CLAUDE.md

This file provides guidance for AI assistants working with this repository.

## Repository Overview

**Name:** hello-world
**Type:** Learning repository with UniFi MCP integration

This repository contains a UniFi MCP (Model Context Protocol) server that enables Claude to interact with UniFi network controllers.

## Current Structure

```
hello-world/
├── README.md                    # Project description
├── CLAUDE.md                    # AI assistant guidance (this file)
└── unifi-mcp-server/            # UniFi MCP server
    ├── src/
    │   ├── index.ts             # MCP server entry point
    │   └── unifi-client.ts      # UniFi API client
    ├── package.json
    ├── tsconfig.json
    ├── .env.example             # Environment variable template
    └── README.md                # MCP server documentation
```

## UniFi MCP Server

### Quick Start

```bash
cd unifi-mcp-server
npm install
npm run build
```

### Configuration

Set these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `UNIFI_CONTROLLER_URL` | Yes | Controller URL (e.g., `https://192.168.1.1:443`) |
| `UNIFI_USERNAME` | Yes | Local admin username |
| `UNIFI_PASSWORD` | Yes | Admin password |
| `UNIFI_SITE` | No | Site name (default: `default`) |
| `UNIFI_IS_UDM_PRO` | No | Set `true` for UDM Pro/SE/UCG |

### Available Tools

- `unifi_list_devices` - List all network devices
- `unifi_get_device` - Get device details by MAC
- `unifi_list_clients` - List connected clients
- `unifi_get_client` - Get client details by MAC
- `unifi_get_site_health` - Get site health status
- `unifi_get_system_info` - Get controller info
- `unifi_get_alerts` - Get active alerts
- `unifi_restart_device` - Restart a device
- `unifi_block_client` - Block a client
- `unifi_unblock_client` - Unblock a client
- `unifi_reconnect_client` - Force client reconnection
- `unifi_get_dpi_stats` - Get DPI statistics

## Development Workflow

### Git Practices

- **Default branch:** main
- **Commit messages:** Use clear, descriptive messages
- **Pull requests:** Create PRs for significant changes

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `claude/` - AI-generated changes

## Code Style

- TypeScript with strict mode
- 2-space indentation
- ES modules (`"type": "module"`)
- Comprehensive JSDoc comments for public APIs

## Commands

```bash
# UniFi MCP Server
cd unifi-mcp-server
npm install         # Install dependencies
npm run build       # Compile TypeScript
npm run dev         # Run in development mode
npm start           # Run compiled server
```

## Notes

- The UniFi API is undocumented and may change between versions
- Local admin accounts are required (SSO/cloud not supported)
- Self-signed SSL certificates are accepted by default
