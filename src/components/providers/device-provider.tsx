"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { CubeDevice, DeviceState } from "@/lib/types";

interface DeviceContextValue {
  devices: CubeDevice[];
  loading: boolean;
  error: string | null;
  sseConnected: boolean;
  refresh: () => Promise<void>;
  updateDeviceOptimistic: (
    serialNumber: string,
    state: DeviceState
  ) => void;
}

const DeviceContext = createContext<DeviceContextValue | null>(null);

export function useDevices() {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDevices must be used within DeviceProvider");
  return ctx;
}

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<CubeDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/devices");
      const json = await res.json();
      if (json.error === 0 && json.data?.device_list) {
        setDevices(json.data.device_list);
      } else {
        setError(json.message || "Failed to fetch devices");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Optimistic state update
  const updateDeviceOptimistic = useCallback(
    (serialNumber: string, newState: DeviceState) => {
      setDevices((prev) =>
        prev.map((d) =>
          d.serial_number === serialNumber
            ? {
                ...d,
                state: { ...d.state, ...newState },
              }
            : d
        )
      );
    },
    []
  );

  // SSE connection
  useEffect(() => {
    fetchDevices();

    const connectSSE = () => {
      const es = new EventSource("/api/sse");
      eventSourceRef.current = es;

      es.onopen = () => setSseConnected(true);
      es.onerror = () => {
        setSseConnected(false);
        es.close();
        // Reconnect after 5s
        setTimeout(connectSSE, 5000);
      };

      // Device state update
      es.addEventListener("device#v2#updateDeviceState", (event) => {
        try {
          const data = JSON.parse(event.data);
          const sn = data.endpoint?.serial_number;
          const payload = data.payload;
          if (sn && payload) {
            setDevices((prev) =>
              prev.map((d) =>
                d.serial_number === sn
                  ? { ...d, state: { ...d.state, ...payload } }
                  : d
              )
            );
          }
        } catch { /* ignore */ }
      });

      // Device online status
      es.addEventListener("device#v2#updateDeviceOnline", (event) => {
        try {
          const data = JSON.parse(event.data);
          const sn = data.endpoint?.serial_number;
          const online = data.payload?.online;
          if (sn !== undefined && online !== undefined) {
            setDevices((prev) =>
              prev.map((d) =>
                d.serial_number === sn ? { ...d, online } : d
              )
            );
          }
        } catch { /* ignore */ }
      });

      // New device added
      es.addEventListener("device#v2#addDevice", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.payload) {
            setDevices((prev) => [...prev, data.payload]);
          }
        } catch { /* ignore */ }
      });

      // Device deleted
      es.addEventListener("device#v2#deleteDevice", (event) => {
        try {
          const data = JSON.parse(event.data);
          const sn = data.endpoint?.serial_number;
          if (sn) {
            setDevices((prev) =>
              prev.filter((d) => d.serial_number !== sn)
            );
          }
        } catch { /* ignore */ }
      });
    };

    connectSSE();

    // Auto-record device history every 5 minutes
    const recordHistory = () => {
      fetch("/api/history/record", { method: "POST" }).catch(() => {});
    };
    recordHistory(); // Record immediately on load
    const historyInterval = setInterval(recordHistory, 5 * 60 * 1000);

    return () => {
      eventSourceRef.current?.close();
      clearInterval(historyInterval);
    };
  }, [fetchDevices]);

  return (
    <DeviceContext.Provider
      value={{
        devices,
        loading,
        error,
        sseConnected,
        refresh: fetchDevices,
        updateDeviceOptimistic,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}
