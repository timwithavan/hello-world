# UniFi MCP Server

An MCP (Model Context Protocol) server that enables Claude to interact with your UniFi network controller. This allows Claude to monitor and manage your UniFi network devices and clients.

## Features

- **Device Management**: List, inspect, and restart UniFi devices (APs, switches, gateways)
- **Client Management**: View connected clients, block/unblock access, force reconnection
- **Monitoring**: Get site health, system info, alerts, and DPI statistics
- **Multi-platform Support**: Works with UniFi Controller, UDM Pro, UDM SE, and UCG Max

## Prerequisites

- Node.js 18 or higher
- A UniFi Controller (self-hosted) or UniFi OS Console (UDM Pro, UDM SE, UCG, etc.)
- Local admin credentials for your UniFi controller

## Installation

```bash
cd unifi-mcp-server
npm install
npm run build
```

## Configuration

The server is configured via environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `UNIFI_CONTROLLER_URL` | Yes | Full URL to your controller (e.g., `https://192.168.1.1:8443`) |
| `UNIFI_USERNAME` | Yes | Local admin username (SSO/cloud accounts not supported) |
| `UNIFI_PASSWORD` | Yes | Admin password |
| `UNIFI_SITE` | No | Site name (default: `default`) |
| `UNIFI_IS_UDM_PRO` | No | Set to `true` for UDM Pro/SE/UCG devices |

### Controller URL Guide

| Device Type | URL Format |
|-------------|------------|
| Self-hosted Controller | `https://your-ip:8443` |
| UDM Pro / UDM SE / UCG | `https://your-ip:443` |
| UniFi OS Server | `https://your-ip:11443` |

## Claude Desktop Configuration

Add this to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "unifi": {
      "command": "node",
      "args": ["/path/to/unifi-mcp-server/dist/index.js"],
      "env": {
        "UNIFI_CONTROLLER_URL": "https://192.168.1.1:443",
        "UNIFI_USERNAME": "your-admin-username",
        "UNIFI_PASSWORD": "your-admin-password",
        "UNIFI_IS_UDM_PRO": "true"
      }
    }
  }
}
```

## Claude Code Configuration

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "unifi": {
      "command": "node",
      "args": ["/path/to/unifi-mcp-server/dist/index.js"],
      "env": {
        "UNIFI_CONTROLLER_URL": "https://192.168.1.1:443",
        "UNIFI_USERNAME": "your-admin-username",
        "UNIFI_PASSWORD": "your-admin-password",
        "UNIFI_IS_UDM_PRO": "true"
      }
    }
  }
}
```

## Available Tools

### Device Operations

| Tool | Description |
|------|-------------|
| `unifi_list_devices` | List all network devices with status |
| `unifi_get_device` | Get detailed info for a specific device |
| `unifi_restart_device` | Restart a device (causes brief interruption) |

### Client Operations

| Tool | Description |
|------|-------------|
| `unifi_list_clients` | List all connected clients |
| `unifi_get_client` | Get detailed info for a specific client |
| `unifi_block_client` | Block a client from the network |
| `unifi_unblock_client` | Unblock a previously blocked client |
| `unifi_reconnect_client` | Force a client to reconnect |

### Monitoring

| Tool | Description |
|------|-------------|
| `unifi_get_site_health` | Get overall site health status |
| `unifi_get_system_info` | Get controller system information |
| `unifi_get_alerts` | Get active alerts and alarms |
| `unifi_get_dpi_stats` | Get traffic/application statistics |

## Example Usage

Once configured, you can ask Claude things like:

- "What devices are on my UniFi network?"
- "Show me all connected clients"
- "Is there anything wrong with my network?"
- "Block the device with MAC aa:bb:cc:dd:ee:ff"
- "Restart the living room access point"
- "What applications are using the most bandwidth?"

## Security Notes

- Uses local authentication only (cloud/SSO accounts are not supported)
- Credentials are stored in your Claude config file
- The server connects directly to your controller over HTTPS
- Consider creating a dedicated read-only admin account for monitoring
- Full admin access is required for management operations (block/restart)

## Troubleshooting

### Connection refused
- Verify the controller URL and port are correct
- Ensure the controller is running and accessible
- Check firewall rules

### Authentication failed
- Verify username and password are correct
- Ensure you're using a local account (not SSO)
- Check if the account is enabled and not locked

### API errors on UDM Pro
- Set `UNIFI_IS_UDM_PRO=true` in your environment
- Use port 443 instead of 8443

### SSL certificate errors
- Self-signed certificates are common for UniFi controllers
- The client allows self-signed certs by default

## License

MIT
