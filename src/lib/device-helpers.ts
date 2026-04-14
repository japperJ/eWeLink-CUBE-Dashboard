import type { CubeDevice, DisplayCategory } from "./types";

// Map display_category to a human-readable label
const categoryLabels: Record<string, string> = {
  plug: "Plugs",
  switch: "Switches",
  light: "Lights",
  curtain: "Curtains",
  contactSensor: "Door/Window Sensors",
  motionSensor: "Motion Sensors",
  temperatureSensor: "Temperature Sensors",
  humiditySensor: "Humidity Sensors",
  temperatureAndHumiditySensor: "Temp & Humidity Sensors",
  waterLeakDetector: "Water Leak Detectors",
  smokeDetector: "Smoke Detectors",
  button: "Buttons",
  camera: "Cameras",
  sensor: "Sensors",
  fanLight: "Fan Lights",
  airConditioner: "Air Conditioners",
  fan: "Fans",
  thermostat: "Thermostats",
};

export function getCategoryLabel(category: DisplayCategory): string {
  return categoryLabels[category] || category;
}

// Group devices by category
export function groupDevicesByCategory(
  devices: CubeDevice[]
): Record<string, CubeDevice[]> {
  const groups: Record<string, CubeDevice[]> = {};
  for (const device of devices) {
    const cat = device.display_category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(device);
  }
  return groups;
}

// Check if device has a specific capability
export function hasCapability(device: CubeDevice, cap: string): boolean {
  return device.capabilities.some((c) => c.capability === cap);
}

// Get state value from nested device state
export function getStateValue<T>(
  device: CubeDevice,
  capability: string,
): T | undefined {
  const capState = device.state?.[capability];
  if (!capState) return undefined;
  return capState as T | undefined;
}

// Is a "switch-like" device (switch, plug)
export function isSwitchLike(device: CubeDevice): boolean {
  return ["switch", "plug"].includes(device.display_category);
}

// Is a light device
export function isLight(device: CubeDevice): boolean {
  return device.display_category === "light" || device.display_category === "fanLight";
}

// Is a sensor device
export function isSensor(device: CubeDevice): boolean {
  return [
    "temperatureSensor",
    "humiditySensor",
    "temperatureAndHumiditySensor",
    "contactSensor",
    "motionSensor",
    "waterLeakDetector",
    "smokeDetector",
    "sensor",
  ].includes(device.display_category);
}
