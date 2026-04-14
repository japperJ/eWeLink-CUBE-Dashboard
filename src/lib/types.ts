// ── Device capability types ────────────────────────────────────

export interface DeviceCapability {
  capability: string;
  permission: string;
  name?: string;
  settings?: Record<string, unknown>;
}

// ── Device state types ─────────────────────────────────────────

export interface PowerState {
  powerState: "on" | "off" | "toggle";
}

export interface ToggleState {
  toggleState: "on" | "off" | "toggle";
}

export interface BrightnessState {
  brightness: number;
}

export interface ColorTemperatureState {
  colorTemperature: number;
}

export interface ColorRGBState {
  red: number;
  green: number;
  blue: number;
}

export interface TemperatureState {
  temperature: number;
}

export interface HumidityState {
  humidity: number;
}

export interface BatteryState {
  battery: number;
}

export interface DetectState {
  detected: boolean;
}

export interface MotionState {
  motion: boolean;
}

export interface VoltageState {
  voltage: number;
}

export interface ElectricCurrentState {
  "electric-current": number;
}

export interface ElectricPowerState {
  "electric-power": number;
}

export type DeviceState = Record<string, Record<string, unknown>>;

// ── Device types ───────────────────────────────────────────────

export type DisplayCategory =
  | "plug"
  | "switch"
  | "light"
  | "curtain"
  | "contactSensor"
  | "motionSensor"
  | "temperatureSensor"
  | "humiditySensor"
  | "temperatureAndHumiditySensor"
  | "waterLeakDetector"
  | "smokeDetector"
  | "button"
  | "camera"
  | "sensor"
  | "fanLight"
  | "airConditioner"
  | "fan"
  | "thermostat"
  | string;

export interface CubeDevice {
  serial_number: string;
  third_serial_number?: string;
  name: string;
  manufacturer: string;
  model: string;
  firmware_version: string;
  display_category: DisplayCategory;
  capabilities: DeviceCapability[];
  protocol?: string;
  state: DeviceState;
  tags?: Record<string, unknown>;
  online: boolean;
}

// ── Gateway types ──────────────────────────────────────────────

export interface GatewayInfo {
  ip: string;
  mac: string;
  domain?: string;
  fw_version: string;
  name: string;
}

export interface GatewayRuntime {
  ram_used: number;
  cpu_used: number;
  power_up_time: string;
  cpu_temp: number;
  cpu_temp_unit: string;
  sd_card_used?: number;
}

// ── API response types ─────────────────────────────────────────

export interface CubeApiResponse<T = unknown> {
  error: number;
  data: T;
  message: string;
}

export interface DeviceListResponse {
  device_list: CubeDevice[];
}

export interface AccessTokenResponse {
  token: string;
}

// ── SSE event types ────────────────────────────────────────────

export interface SSEDeviceStateEvent {
  endpoint: {
    serial_number: string;
    third_serial_number?: string;
  };
  payload: DeviceState;
}

export interface SSEDeviceOnlineEvent {
  endpoint: {
    serial_number: string;
    third_serial_number?: string;
  };
  payload: {
    online: boolean;
  };
}

export interface SSEDeviceAddEvent {
  payload: CubeDevice;
}

export interface SSEDeviceDeleteEvent {
  endpoint: {
    serial_number: string;
    third_serial_number?: string;
  };
}

// ── Power Consumption ──────────────────────────────────────────

export interface PowerConsumptionInterval {
  usage: number;
  start: string;
  end: string;
}

export interface PowerConsumptionResult {
  type: string;
  rlSummarize?: number;
  electricityIntervals?: PowerConsumptionInterval[];
}
