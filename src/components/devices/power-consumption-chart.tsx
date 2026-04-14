"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Zap, RefreshCw } from "lucide-react";
import { useDevices } from "@/components/providers/device-provider";
import { hasCapability } from "@/lib/device-helpers";
import type { CubeDevice } from "@/lib/types";

interface PowerDataPoint {
  time: string;
  value: number;
}

export function PowerConsumptionChart() {
  const { devices } = useDevices();
  const [data, setData] = useState<PowerDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<CubeDevice | null>(null);

  // Find devices with power-consumption capability
  const powerDevices = devices.filter((d) =>
    hasCapability(d, "power-consumption")
  );

  useEffect(() => {
    if (powerDevices.length > 0 && !selectedDevice) {
      setSelectedDevice(powerDevices[0]);
    }
  }, [powerDevices, selectedDevice]);

  const fetchPowerData = useCallback(async () => {
    if (!selectedDevice) return;
    setLoading(true);
    try {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const res = await fetch(
        `/api/devices/${selectedDevice.serial_number}/query-state`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            capability: "power-consumption",
            query_state: {
              start_time: startOfDay.toISOString(),
              end_time: now.toISOString(),
              interval: "hourly",
            },
          }),
        }
      );

      const json = await res.json();
      if (json.error === 0 && json.data?.power_consumption) {
        const points: PowerDataPoint[] = json.data.power_consumption.map(
          (item: { time: string; value: number }) => ({
            time: new Date(item.time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            value: item.value,
          })
        );
        setData(points);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [selectedDevice]);

  useEffect(() => {
    if (selectedDevice) {
      fetchPowerData();
    }
  }, [selectedDevice, fetchPowerData]);

  if (powerDevices.length === 0) {
    return null; // Don't show if no devices have power-consumption
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-yellow-500" />
            Power Consumption
          </CardTitle>
          <div className="flex items-center gap-2">
            {powerDevices.length > 1 && (
              <select
                className="text-xs border rounded px-2 py-1 bg-background"
                value={selectedDevice?.serial_number || ""}
                onChange={(e) => {
                  const dev = powerDevices.find(
                    (d) => d.serial_number === e.target.value
                  );
                  if (dev) setSelectedDevice(dev);
                }}
                aria-label="Select power device"
              >
                {powerDevices.map((d) => (
                  <option key={d.serial_number} value={d.serial_number}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={fetchPowerData}
              disabled={loading}
              className="p-1 rounded hover:bg-muted transition-colors"
              aria-label="Refresh power data"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                className="text-xs"
                tick={{ fontSize: 10 }}
              />
              <YAxis className="text-xs" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            {loading ? "Loading..." : "No power data available today"}
          </div>
        )}
        {selectedDevice && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {selectedDevice.name}
            </Badge>
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
