/**
 * Universal Server Panel Integration Service
 * Supports Pterodactyl Panel (Client API) and Crafty Controller (v4 REST API)
 */

export interface PanelConfig {
  provider: 'none' | 'pterodactyl' | 'crafty';
  panelUrl: string;
  serverId: string;
  apiKey: string;
}

export interface ServerResourceStats {
  status: 'running' | 'starting' | 'stopping' | 'offline' | 'error';
  cpuPercent: number;
  memoryBytes: number;
  memoryLimitBytes: number;
  diskBytes: number;
  uptimeMs: number;
  provider: 'pterodactyl' | 'crafty' | 'none';
}

/**
 * 1. Pterodactyl Panel Client API Adapter
 */
export async function getPterodactylStats(config: PanelConfig): Promise<ServerResourceStats> {
  const cleanUrl = config.panelUrl.trim().replace(/\/+$/, '');
  const url = `${cleanUrl}/api/client/servers/${config.serverId.trim()}/resources`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.apiKey.trim()}`,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Pterodactyl API error (${res.status}): ${await res.text()}`);
  }

  const json = await res.json();
  const attributes = json.attributes;
  const current_state = attributes.current_state || 'offline';
  const resources = attributes.resources || {};

  return {
    status: current_state,
    cpuPercent: Math.round((resources.cpu_absolute || 0) * 10) / 10,
    memoryBytes: resources.memory_bytes || 0,
    memoryLimitBytes: resources.memory_limit_bytes || 0,
    diskBytes: resources.disk_bytes || 0,
    uptimeMs: resources.uptime || 0,
    provider: 'pterodactyl',
  };
}

export async function sendPterodactylPowerAction(config: PanelConfig, signal: 'start' | 'stop' | 'restart' | 'kill'): Promise<boolean> {
  const cleanUrl = config.panelUrl.trim().replace(/\/+$/, '');
  const url = `${cleanUrl}/api/client/servers/${config.serverId.trim()}/power`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey.trim()}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ signal }),
  });

  if (!res.ok && res.status !== 204) {
    throw new Error(`Pterodactyl power action failed (${res.status}): ${await res.text()}`);
  }

  return true;
}

export async function sendPterodactylConsoleCommand(config: PanelConfig, command: string): Promise<boolean> {
  const cleanUrl = config.panelUrl.trim().replace(/\/+$/, '');
  const url = `${cleanUrl}/api/client/servers/${config.serverId.trim()}/command`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey.trim()}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ command }),
  });

  if (!res.ok && res.status !== 204) {
    throw new Error(`Pterodactyl command execution failed (${res.status}): ${await res.text()}`);
  }

  return true;
}

/**
 * 2. Crafty Controller v4 REST API Adapter
 */
export async function getCraftyStats(config: PanelConfig): Promise<ServerResourceStats> {
  const cleanUrl = config.panelUrl.trim().replace(/\/+$/, '');
  const url = `${cleanUrl}/api/v2/servers/${config.serverId.trim()}/stats`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.apiKey.trim()}`,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Crafty Controller API error (${res.status}): ${await res.text()}`);
  }

  const json = await res.json();
  const data = json.data || json;

  const isRunning = Boolean(data.running);
  const cpu = parseFloat(data.cpu || '0');
  const memoryMB = parseFloat(data.mem || '0');

  return {
    status: isRunning ? 'running' : 'offline',
    cpuPercent: Math.round(cpu * 10) / 10,
    memoryBytes: memoryMB * 1024 * 1024,
    memoryLimitBytes: (parseFloat(data.mem_max || '0')) * 1024 * 1024,
    diskBytes: (parseFloat(data.disk || '0')) * 1024 * 1024,
    uptimeMs: isRunning ? 1000 : 0,
    provider: 'crafty',
  };
}

export async function sendCraftyPowerAction(config: PanelConfig, signal: 'start' | 'stop' | 'restart' | 'kill'): Promise<boolean> {
  const cleanUrl = config.panelUrl.trim().replace(/\/+$/, '');
  
  // Map signal to Crafty v2 action
  let action = 'start_server';
  if (signal === 'stop') action = 'stop_server';
  if (signal === 'restart') action = 'restart_server';
  if (signal === 'kill') action = 'kill_server';

  const url = `${cleanUrl}/api/v2/servers/${config.serverId.trim()}/action/${action}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey.trim()}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Crafty power action failed (${res.status}): ${await res.text()}`);
  }

  return true;
}

export async function sendCraftyConsoleCommand(config: PanelConfig, command: string): Promise<boolean> {
  const cleanUrl = config.panelUrl.trim().replace(/\/+$/, '');
  const url = `${cleanUrl}/api/v2/servers/${config.serverId.trim()}/stdin`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey.trim()}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ command }),
  });

  if (!res.ok) {
    throw new Error(`Crafty command dispatch failed (${res.status}): ${await res.text()}`);
  }

  return true;
}

/**
 * Universal Dispatcher
 */
export async function getLiveServerStats(config: PanelConfig): Promise<ServerResourceStats> {
  if (config.provider === 'pterodactyl') {
    return await getPterodactylStats(config);
  }
  if (config.provider === 'crafty') {
    return await getCraftyStats(config);
  }
  return {
    status: 'offline',
    cpuPercent: 0,
    memoryBytes: 0,
    memoryLimitBytes: 0,
    diskBytes: 0,
    uptimeMs: 0,
    provider: 'none',
  };
}

export async function sendServerPower(config: PanelConfig, signal: 'start' | 'stop' | 'restart' | 'kill'): Promise<boolean> {
  if (config.provider === 'pterodactyl') {
    return await sendPterodactylPowerAction(config, signal);
  }
  if (config.provider === 'crafty') {
    return await sendCraftyPowerAction(config, signal);
  }
  throw new Error('No server management panel configured');
}

export async function sendServerConsoleCommand(config: PanelConfig, command: string): Promise<boolean> {
  if (config.provider === 'pterodactyl') {
    return await sendPterodactylConsoleCommand(config, command);
  }
  if (config.provider === 'crafty') {
    return await sendCraftyConsoleCommand(config, command);
  }
  throw new Error('No server management panel configured');
}
