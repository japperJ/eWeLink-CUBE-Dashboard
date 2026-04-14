import type {
  CubeApiResponse,
  GatewayInfo,
  GatewayRuntime,
  DeviceListResponse,
  AccessTokenResponse,
  CubeDevice,
} from "./types";

function getBaseUrl() {
  return process.env.CUBE_BASE_URL || "";
}

function getAccessToken() {
  return process.env.CUBE_ACCESS_TOKEN || "";
}

function headers(withAuth = true): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (withAuth && token) {
    h["Authorization"] = `Bearer ${token}`;
  }
  return h;
}

async function cubeRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<CubeApiResponse<T>> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers(true),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`CUBE API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ── Gateway ────────────────────────────────────────────────────

export async function getGatewayInfo(): Promise<CubeApiResponse<GatewayInfo>> {
  return cubeRequest<GatewayInfo>("/open-api/v2/rest/bridge");
}

export async function getGatewayRuntime(): Promise<
  CubeApiResponse<GatewayRuntime>
> {
  return cubeRequest<GatewayRuntime>("/open-api/v2/rest/bridge/runtime");
}

export async function setGatewayVolume(
  volume: number
): Promise<CubeApiResponse<object>> {
  return cubeRequest<object>("/open-api/v2/rest/bridge/config", {
    method: "PUT",
    body: JSON.stringify({ volume }),
  });
}

export async function muteGateway(): Promise<CubeApiResponse<object>> {
  return cubeRequest<object>("/open-api/v2/rest/bridge/mute", {
    method: "PUT",
  });
}

export async function unmuteGateway(): Promise<CubeApiResponse<object>> {
  return cubeRequest<object>("/open-api/v2/rest/bridge/unmute", {
    method: "PUT",
  });
}

// ── Access Token ───────────────────────────────────────────────

export async function requestAccessToken(): Promise<
  CubeApiResponse<AccessTokenResponse>
> {
  const url = `${getBaseUrl()}/open-api/v2/rest/bridge/access_token?app_name=ewelink-dashboard`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

// ── Devices ────────────────────────────────────────────────────

export async function getDevices(): Promise<
  CubeApiResponse<DeviceListResponse>
> {
  return cubeRequest<DeviceListResponse>("/open-api/v2/rest/devices");
}

export async function updateDevice(
  serialNumber: string,
  data: {
    name?: string;
    tags?: Record<string, unknown>;
    state?: Record<string, unknown>;
  }
): Promise<CubeApiResponse<CubeDevice>> {
  return cubeRequest<CubeDevice>(
    `/open-api/v2/rest/devices/${encodeURIComponent(serialNumber)}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export async function queryDeviceState(
  serialNumber: string,
  capability: string,
  queryState: Record<string, unknown>
): Promise<CubeApiResponse<object>> {
  return cubeRequest<object>(
    `/open-api/v2/rest/devices/${encodeURIComponent(serialNumber)}/query-state/${encodeURIComponent(capability)}`,
    {
      method: "POST",
      body: JSON.stringify({ query_state: queryState }),
    }
  );
}

// ── SSE URL ────────────────────────────────────────────────────

export function getSSEUrl(): string {
  return `${getBaseUrl()}/open-api/v2/sse/bridge?access_token=${getAccessToken()}`;
}


