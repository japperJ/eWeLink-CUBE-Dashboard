// Widget configuration types and localStorage persistence

export type WidgetView = "grid" | "list" | "compact";

export interface Widget {
  id: string;
  name: string;
  view: WidgetView;
  /** Empty array = show ALL devices */
  deviceSerialNumbers: string[];
  collapsed: boolean;
}

const STORAGE_KEY = "ewelink-dashboard-widgets";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getDefaultWidget(): Widget {
  return {
    id: "default",
    name: "All Devices",
    view: "grid",
    deviceSerialNumbers: [],
    collapsed: false,
  };
}

export function loadWidgets(): Widget[] {
  if (typeof window === "undefined") return [getDefaultWidget()];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [getDefaultWidget()];
    const parsed = JSON.parse(raw) as Widget[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [getDefaultWidget()];
    return parsed;
  } catch {
    return [getDefaultWidget()];
  }
}

export function saveWidgets(widgets: Widget[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
}

export function createWidget(name: string, view: WidgetView, deviceSerialNumbers: string[]): Widget {
  return {
    id: generateId(),
    name,
    view,
    deviceSerialNumbers,
    collapsed: false,
  };
}
