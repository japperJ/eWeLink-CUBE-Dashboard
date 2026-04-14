"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  History,
  Thermometer,
  Droplets,
  BatteryMedium,
  Wifi,
  Zap,
  Database,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface DeviceInfo {
  serial_number: string;
  device_name: string;
  capabilities: string[];
}

interface Reading {
  id: number;
  serial_number: string;
  device_name: string;
  capability: string;
  value: number;
  unit: string;
  recorded_at: number;
}

interface ChartPoint {
  time: string;
  timestamp: number;
  value: number;
}

const RANGES = ["1h", "6h", "24h", "7d", "30d"] as const;
type Range = (typeof RANGES)[number];

const RANGE_LABELS: Record<Range, string> = {
  "1h": "1 Hour",
  "6h": "6 Hours",
  "24h": "24 Hours",
  "7d": "7 Days",
  "30d": "30 Days",
};

const CAP_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof Thermometer; unit: string }
> = {
  temperature: {
    label: "Temperature",
    color: "#ef4444",
    icon: Thermometer,
    unit: "°C",
  },
  humidity: {
    label: "Humidity",
    color: "#3b82f6",
    icon: Droplets,
    unit: "%",
  },
  battery: {
    label: "Battery",
    color: "#22c55e",
    icon: BatteryMedium,
    unit: "%",
  },
  rssi: {
    label: "Signal (RSSI)",
    color: "#a855f7",
    icon: Wifi,
    unit: "dBm",
  },
  voltage: {
    label: "Voltage",
    color: "#f59e0b",
    icon: Zap,
    unit: "V",
  },
  "electric-power": {
    label: "Power",
    color: "#f97316",
    icon: Zap,
    unit: "W",
  },
};

function formatTime(ts: number, range: Range): string {
  const d = new Date(ts);
  if (range === "1h" || range === "6h") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (range === "24h") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return (
    d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

export default function HistoryPage() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedCap, setSelectedCap] = useState<string>("");
  const [range, setRange] = useState<Range>("24h");
  const [readings, setReadings] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ total_readings: number } | null>(null);
  const [recordStatus, setRecordStatus] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch devices that have history
  const fetchDevices = useCallback(async () => {
    const res = await fetch("/api/history?action=devices");
    const json = await res.json();
    if (json.error === 0) {
      setDevices(json.data || []);
      // Auto-select first device if none selected
      if (!selectedDevice && json.data?.length > 0) {
        setSelectedDevice(json.data[0].serial_number);
        if (json.data[0].capabilities?.length > 0) {
          setSelectedCap(json.data[0].capabilities[0]);
        }
      }
    }
  }, [selectedDevice]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/history?action=stats");
    const json = await res.json();
    if (json.error === 0) setStats(json.data);
  }, []);

  // Fetch chart data
  const fetchReadings = useCallback(async () => {
    if (!selectedDevice || !selectedCap) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        serial_number: selectedDevice,
        capability: selectedCap,
        range,
      });
      const res = await fetch(`/api/history?${params}`);
      const json = await res.json();
      if (json.error === 0) {
        const points: ChartPoint[] = (json.data.readings || []).map(
          (r: Reading) => ({
            time: formatTime(r.recorded_at, range),
            timestamp: r.recorded_at,
            value: r.value,
          })
        );
        setReadings(points);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, selectedCap, range]);

  // Record now
  const recordNow = useCallback(async () => {
    setRecordStatus("Recording...");
    try {
      const res = await fetch("/api/history/record", { method: "POST" });
      const json = await res.json();
      if (json.error === 0) {
        setRecordStatus(
          `Saved ${json.data.readings_recorded} readings (${json.data.total_readings} total)`
        );
        // Refresh data
        fetchDevices();
        fetchStats();
        fetchReadings();
      } else {
        setRecordStatus(`Error: ${json.message}`);
      }
    } catch (e) {
      setRecordStatus(`Error: ${(e as Error).message}`);
    }
    setTimeout(() => setRecordStatus(""), 5000);
  }, [fetchDevices, fetchStats, fetchReadings]);

  // Initial load + auto-record every 5 minutes
  useEffect(() => {
    fetchDevices();
    fetchStats();
    // Record immediately on page load
    recordNow();

    intervalRef.current = setInterval(() => {
      recordNow();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch readings when selection changes
  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  // When device changes, pick first available capability
  const handleDeviceChange = (sn: string) => {
    setSelectedDevice(sn);
    const dev = devices.find((d) => d.serial_number === sn);
    if (dev && dev.capabilities.length > 0) {
      setSelectedCap(dev.capabilities[0]);
    }
  };

  const currentDeviceCaps =
    devices.find((d) => d.serial_number === selectedDevice)?.capabilities || [];

  const capConfig = CAP_CONFIG[selectedCap] || {
    label: selectedCap,
    color: "#6366f1",
    icon: Zap,
    unit: "",
  };

  // Stats for visible data
  const minVal = readings.length
    ? Math.min(...readings.map((r) => r.value))
    : 0;
  const maxVal = readings.length
    ? Math.max(...readings.map((r) => r.value))
    : 0;
  const avgVal = readings.length
    ? readings.reduce((a, r) => a + r.value, 0) / readings.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">History</h2>
          <p className="text-sm text-muted-foreground">
            Sensor data recorded over time
          </p>
        </div>
        <div className="flex items-center gap-3">
          {recordStatus && (
            <span className="text-xs text-muted-foreground animate-in fade-in">
              {recordStatus}
            </span>
          )}
          <button
            onClick={recordNow}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors touch-manipulation"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Record Now
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Database className="h-3.5 w-3.5" />
              Total Readings
            </div>
            <p className="text-xl font-bold">
              {stats?.total_readings?.toLocaleString() || "0"}
            </p>
          </CardContent>
        </Card>
        {readings.length > 0 && (
          <>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  Min
                </div>
                <p className="text-xl font-bold font-mono">
                  {minVal.toFixed(1)}
                  <span className="text-sm text-muted-foreground ml-1">
                    {capConfig.unit}
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  Avg
                </div>
                <p className="text-xl font-bold font-mono">
                  {avgVal.toFixed(1)}
                  <span className="text-sm text-muted-foreground ml-1">
                    {capConfig.unit}
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  Max
                </div>
                <p className="text-xl font-bold font-mono">
                  {maxVal.toFixed(1)}
                  <span className="text-sm text-muted-foreground ml-1">
                    {capConfig.unit}
                  </span>
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            {/* Device selector */}
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="device-select" className="text-xs text-muted-foreground block mb-1.5">
                Device
              </label>
              <select
                id="device-select"
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm touch-manipulation"
                value={selectedDevice}
                onChange={(e) => handleDeviceChange(e.target.value)}
              >
                {devices.length === 0 && (
                  <option value="">No history yet — data recording...</option>
                )}
                {devices.map((d) => (
                  <option key={d.serial_number} value={d.serial_number}>
                    {d.device_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Capability selector */}
            <div className="min-w-[160px]">
              <label htmlFor="metric-select" className="text-xs text-muted-foreground block mb-1.5">
                Metric
              </label>
              <select
                id="metric-select"
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm touch-manipulation"
                value={selectedCap}
                onChange={(e) => setSelectedCap(e.target.value)}
              >
                {currentDeviceCaps.map((cap) => (
                  <option key={cap} value={cap}>
                    {CAP_CONFIG[cap]?.label || cap}
                  </option>
                ))}
              </select>
            </div>

            {/* Time range */}
            <div className="w-full sm:w-auto">
              <label className="text-xs text-muted-foreground block mb-1.5">
                Time Range
              </label>
              <div className="flex gap-1">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    className={`flex-1 sm:flex-none px-2.5 py-2 text-xs rounded-md transition-colors touch-manipulation ${
                      range === r
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                    onClick={() => setRange(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <capConfig.icon className="h-4 w-4" style={{ color: capConfig.color }} />
              {capConfig.label}
              <Badge variant="secondary" className="text-[10px]">
                {RANGE_LABELS[range]}
              </Badge>
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {readings.length} data points
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : readings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <History className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No data for this selection yet</p>
              <p className="text-xs mt-1">
                Data is recorded every 5 minutes. Click &quot;Record Now&quot; to
                capture a snapshot.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280} className="sm:[&]:h-[300px]">
              <AreaChart data={readings}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={capConfig.color}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={capConfig.color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => `${v}${capConfig.unit}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: 12,
                  }}
                  formatter={(value) => [
                    `${Number(value).toFixed(1)} ${capConfig.unit}`,
                    capConfig.label,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={capConfig.color}
                  strokeWidth={2}
                  fill="url(#colorValue)"
                  dot={readings.length < 50}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
