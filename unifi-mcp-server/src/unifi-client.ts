/**
 * UniFi Controller API Client
 * Handles authentication and API requests to UniFi Controller
 */

export interface UniFiConfig {
  controllerUrl: string;
  username: string;
  password: string;
  site?: string;
  isUdmPro?: boolean;
}

export interface UniFiDevice {
  _id: string;
  mac: string;
  model: string;
  name?: string;
  type: string;
  state: number;
  adopted: boolean;
  ip?: string;
  uptime?: number;
  version?: string;
  serial?: string;
}

export interface UniFiClient {
  _id: string;
  mac: string;
  hostname?: string;
  name?: string;
  ip?: string;
  network?: string;
  is_wired: boolean;
  is_guest: boolean;
  uptime?: number;
  tx_bytes?: number;
  rx_bytes?: number;
  signal?: number;
  ap_mac?: string;
}

export interface UniFiSiteStats {
  wan?: {
    tx_bytes: number;
    rx_bytes: number;
  };
  wlan?: {
    num_sta: number;
  };
  lan?: {
    num_sta: number;
  };
  num_sta: number;
  num_ap: number;
  num_sw: number;
}

export class UniFiClient {
  private config: UniFiConfig;
  private cookies: string = '';
  private csrfToken: string = '';

  constructor(config: UniFiConfig) {
    this.config = {
      site: 'default',
      isUdmPro: false,
      ...config,
    };
  }

  private getBaseUrl(): string {
    return this.config.controllerUrl.replace(/\/$/, '');
  }

  private getApiPrefix(): string {
    // UDM Pro and UCG Max require /proxy/network prefix
    return this.config.isUdmPro ? '/proxy/network' : '';
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: object
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${this.getApiPrefix()}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.cookies) {
      headers['Cookie'] = this.cookies;
    }

    if (this.csrfToken) {
      headers['X-Csrf-Token'] = this.csrfToken;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      // Allow self-signed certificates (common for UniFi controllers)
    });

    // Store cookies from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      this.cookies = setCookie.split(',').map(c => c.split(';')[0]).join('; ');

      // Extract CSRF token if present
      const csrfMatch = setCookie.match(/csrf_token=([^;]+)/);
      if (csrfMatch) {
        this.csrfToken = csrfMatch[1];
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`UniFi API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Authenticate with the UniFi Controller
   */
  async login(): Promise<boolean> {
    const loginEndpoint = this.config.isUdmPro
      ? '/api/auth/login'
      : '/api/login';

    try {
      await this.request('POST', loginEndpoint, {
        username: this.config.username,
        password: this.config.password,
      });
      return true;
    } catch (error) {
      throw new Error(`Login failed: ${error}`);
    }
  }

  /**
   * Logout from the UniFi Controller
   */
  async logout(): Promise<void> {
    const logoutEndpoint = this.config.isUdmPro
      ? '/api/auth/logout'
      : '/api/logout';

    await this.request('POST', logoutEndpoint);
    this.cookies = '';
    this.csrfToken = '';
  }

  /**
   * Get all network devices (APs, switches, gateways)
   */
  async getDevices(): Promise<UniFiDevice[]> {
    const response = await this.request<{ data: UniFiDevice[] }>(
      'GET',
      `/api/s/${this.config.site}/stat/device`
    );
    return response.data;
  }

  /**
   * Get a specific device by MAC address
   */
  async getDevice(mac: string): Promise<UniFiDevice | null> {
    const response = await this.request<{ data: UniFiDevice[] }>(
      'GET',
      `/api/s/${this.config.site}/stat/device/${mac.toLowerCase()}`
    );
    return response.data[0] || null;
  }

  /**
   * Get all connected clients
   */
  async getClients(): Promise<UniFiClient[]> {
    const response = await this.request<{ data: UniFiClient[] }>(
      'GET',
      `/api/s/${this.config.site}/stat/sta`
    );
    return response.data;
  }

  /**
   * Get all known clients (including offline)
   */
  async getAllClients(): Promise<UniFiClient[]> {
    const response = await this.request<{ data: UniFiClient[] }>(
      'GET',
      `/api/s/${this.config.site}/stat/alluser`
    );
    return response.data;
  }

  /**
   * Get client by MAC address
   */
  async getClient(mac: string): Promise<UniFiClient | null> {
    const response = await this.request<{ data: UniFiClient[] }>(
      'GET',
      `/api/s/${this.config.site}/stat/user/${mac.toLowerCase()}`
    );
    return response.data[0] || null;
  }

  /**
   * Get site statistics
   */
  async getSiteStats(): Promise<UniFiSiteStats> {
    const response = await this.request<{ data: UniFiSiteStats[] }>(
      'GET',
      `/api/s/${this.config.site}/stat/sites`
    );
    return response.data[0];
  }

  /**
   * Get site health information
   */
  async getSiteHealth(): Promise<object[]> {
    const response = await this.request<{ data: object[] }>(
      'GET',
      `/api/s/${this.config.site}/stat/health`
    );
    return response.data;
  }

  /**
   * Restart a device
   */
  async restartDevice(mac: string): Promise<void> {
    await this.request('POST', `/api/s/${this.config.site}/cmd/devmgr`, {
      cmd: 'restart',
      mac: mac.toLowerCase(),
    });
  }

  /**
   * Block a client
   */
  async blockClient(mac: string): Promise<void> {
    await this.request('POST', `/api/s/${this.config.site}/cmd/stamgr`, {
      cmd: 'block-sta',
      mac: mac.toLowerCase(),
    });
  }

  /**
   * Unblock a client
   */
  async unblockClient(mac: string): Promise<void> {
    await this.request('POST', `/api/s/${this.config.site}/cmd/stamgr`, {
      cmd: 'unblock-sta',
      mac: mac.toLowerCase(),
    });
  }

  /**
   * Disconnect/reconnect a client
   */
  async reconnectClient(mac: string): Promise<void> {
    await this.request('POST', `/api/s/${this.config.site}/cmd/stamgr`, {
      cmd: 'kick-sta',
      mac: mac.toLowerCase(),
    });
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<object> {
    const response = await this.request<{ data: object[] }>(
      'GET',
      `/api/s/${this.config.site}/stat/sysinfo`
    );
    return response.data[0] || {};
  }

  /**
   * Get active alerts
   */
  async getAlerts(): Promise<object[]> {
    const response = await this.request<{ data: object[] }>(
      'GET',
      `/api/s/${this.config.site}/stat/alarm`
    );
    return response.data;
  }

  /**
   * Get DPI (Deep Packet Inspection) statistics
   */
  async getDpiStats(): Promise<object[]> {
    const response = await this.request<{ data: object[] }>(
      'GET',
      `/api/s/${this.config.site}/stat/dpi`
    );
    return response.data;
  }
}
