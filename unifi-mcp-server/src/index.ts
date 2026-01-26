#!/usr/bin/env node

/**
 * UniFi MCP Server
 * Provides Claude with tools to interact with UniFi Controller API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { UniFiClient, UniFiConfig } from './unifi-client.js';

// Configuration from environment variables
function getConfig(): UniFiConfig {
  const controllerUrl = process.env.UNIFI_CONTROLLER_URL;
  const username = process.env.UNIFI_USERNAME;
  const password = process.env.UNIFI_PASSWORD;

  if (!controllerUrl || !username || !password) {
    throw new Error(
      'Missing required environment variables: UNIFI_CONTROLLER_URL, UNIFI_USERNAME, UNIFI_PASSWORD'
    );
  }

  return {
    controllerUrl,
    username,
    password,
    site: process.env.UNIFI_SITE || 'default',
    isUdmPro: process.env.UNIFI_IS_UDM_PRO === 'true',
  };
}

// Define available tools
const tools: Tool[] = [
  {
    name: 'unifi_list_devices',
    description:
      'List all UniFi network devices (access points, switches, gateways). Returns device name, MAC, model, IP, state, and uptime.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'unifi_get_device',
    description:
      'Get detailed information about a specific UniFi device by MAC address.',
    inputSchema: {
      type: 'object',
      properties: {
        mac: {
          type: 'string',
          description: 'MAC address of the device (e.g., "aa:bb:cc:dd:ee:ff")',
        },
      },
      required: ['mac'],
    },
  },
  {
    name: 'unifi_list_clients',
    description:
      'List all currently connected clients on the network. Returns hostname, MAC, IP, connection type (wired/wireless), and signal strength.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'unifi_get_client',
    description:
      'Get detailed information about a specific client by MAC address.',
    inputSchema: {
      type: 'object',
      properties: {
        mac: {
          type: 'string',
          description: 'MAC address of the client (e.g., "aa:bb:cc:dd:ee:ff")',
        },
      },
      required: ['mac'],
    },
  },
  {
    name: 'unifi_get_site_health',
    description:
      'Get overall health status of the UniFi site including WAN, LAN, and WLAN subsystems.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'unifi_get_system_info',
    description:
      'Get system information about the UniFi controller including version and uptime.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'unifi_get_alerts',
    description: 'Get active alerts and alarms from the UniFi controller.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'unifi_restart_device',
    description:
      'Restart a UniFi device (access point, switch, or gateway). Use with caution as this will cause a brief network interruption for connected clients.',
    inputSchema: {
      type: 'object',
      properties: {
        mac: {
          type: 'string',
          description:
            'MAC address of the device to restart (e.g., "aa:bb:cc:dd:ee:ff")',
        },
      },
      required: ['mac'],
    },
  },
  {
    name: 'unifi_block_client',
    description:
      'Block a client from accessing the network. The client will be immediately disconnected and prevented from reconnecting.',
    inputSchema: {
      type: 'object',
      properties: {
        mac: {
          type: 'string',
          description:
            'MAC address of the client to block (e.g., "aa:bb:cc:dd:ee:ff")',
        },
      },
      required: ['mac'],
    },
  },
  {
    name: 'unifi_unblock_client',
    description:
      'Unblock a previously blocked client, allowing them to reconnect to the network.',
    inputSchema: {
      type: 'object',
      properties: {
        mac: {
          type: 'string',
          description:
            'MAC address of the client to unblock (e.g., "aa:bb:cc:dd:ee:ff")',
        },
      },
      required: ['mac'],
    },
  },
  {
    name: 'unifi_reconnect_client',
    description:
      'Force a client to disconnect and reconnect. Useful for troubleshooting connection issues.',
    inputSchema: {
      type: 'object',
      properties: {
        mac: {
          type: 'string',
          description:
            'MAC address of the client to reconnect (e.g., "aa:bb:cc:dd:ee:ff")',
        },
      },
      required: ['mac'],
    },
  },
  {
    name: 'unifi_get_dpi_stats',
    description:
      'Get Deep Packet Inspection (DPI) statistics showing application and traffic category usage.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

async function main() {
  const config = getConfig();
  const unifiClient = new UniFiClient(config);

  // Create the MCP server
  const server = new Server(
    {
      name: 'unifi-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Login before each request (handles session expiry)
      await unifiClient.login();

      let result: unknown;

      switch (name) {
        case 'unifi_list_devices': {
          const devices = await unifiClient.getDevices();
          result = devices.map((d) => ({
            name: d.name || 'Unnamed',
            mac: d.mac,
            model: d.model,
            type: d.type,
            ip: d.ip,
            state: d.state === 1 ? 'online' : 'offline',
            uptime: d.uptime
              ? `${Math.floor(d.uptime / 86400)}d ${Math.floor((d.uptime % 86400) / 3600)}h`
              : 'N/A',
            version: d.version,
          }));
          break;
        }

        case 'unifi_get_device': {
          const mac = (args as { mac: string }).mac;
          const device = await unifiClient.getDevice(mac);
          if (!device) {
            result = { error: `Device with MAC ${mac} not found` };
          } else {
            result = device;
          }
          break;
        }

        case 'unifi_list_clients': {
          const clients = await unifiClient.getClients();
          result = clients.map((c) => ({
            name: c.name || c.hostname || 'Unknown',
            mac: c.mac,
            ip: c.ip,
            connection: c.is_wired ? 'wired' : 'wireless',
            is_guest: c.is_guest,
            signal: c.signal ? `${c.signal} dBm` : 'N/A',
            uptime: c.uptime
              ? `${Math.floor(c.uptime / 3600)}h ${Math.floor((c.uptime % 3600) / 60)}m`
              : 'N/A',
            tx_bytes: c.tx_bytes,
            rx_bytes: c.rx_bytes,
          }));
          break;
        }

        case 'unifi_get_client': {
          const mac = (args as { mac: string }).mac;
          const client = await unifiClient.getClient(mac);
          if (!client) {
            result = { error: `Client with MAC ${mac} not found` };
          } else {
            result = client;
          }
          break;
        }

        case 'unifi_get_site_health': {
          result = await unifiClient.getSiteHealth();
          break;
        }

        case 'unifi_get_system_info': {
          result = await unifiClient.getSystemInfo();
          break;
        }

        case 'unifi_get_alerts': {
          result = await unifiClient.getAlerts();
          break;
        }

        case 'unifi_restart_device': {
          const mac = (args as { mac: string }).mac;
          await unifiClient.restartDevice(mac);
          result = { success: true, message: `Device ${mac} restart initiated` };
          break;
        }

        case 'unifi_block_client': {
          const mac = (args as { mac: string }).mac;
          await unifiClient.blockClient(mac);
          result = { success: true, message: `Client ${mac} has been blocked` };
          break;
        }

        case 'unifi_unblock_client': {
          const mac = (args as { mac: string }).mac;
          await unifiClient.unblockClient(mac);
          result = { success: true, message: `Client ${mac} has been unblocked` };
          break;
        }

        case 'unifi_reconnect_client': {
          const mac = (args as { mac: string }).mac;
          await unifiClient.reconnectClient(mac);
          result = {
            success: true,
            message: `Client ${mac} has been disconnected and will reconnect`,
          };
          break;
        }

        case 'unifi_get_dpi_stats': {
          result = await unifiClient.getDpiStats();
          break;
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${message}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('UniFi MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
