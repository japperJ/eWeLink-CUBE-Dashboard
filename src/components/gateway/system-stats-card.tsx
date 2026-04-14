"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Cpu, MemoryStick, Thermometer, Clock } from "lucide-react";
import type { GatewayRuntime } from "@/lib/types";

export function SystemStatsCard() {
  const [stats, setStats] = useState<GatewayRuntime | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/gateway/runtime");
      const json = await res.json();
      if (json.error === 0 && json.data) {
        setStats(json.data);
        setError(null);
      } else {
        setError(json.message || "Failed to load");
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="h-4 w-4" />
            System Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const uptime = stats
    ? formatUptime(stats.power_up_time)
    : "...";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cpu className="h-4 w-4 text-primary" />
          System Stats
        </CardTitle>
        <CardDescription>Real-time gateway performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats ? (
          <>
            <StatBar
              icon={Cpu}
              label="CPU"
              value={stats.cpu_used}
              unit="%"
              color={stats.cpu_used > 80 ? "destructive" : "default"}
            />
            <StatBar
              icon={MemoryStick}
              label="RAM"
              value={stats.ram_used}
              unit="%"
              color={stats.ram_used > 80 ? "destructive" : "default"}
            />
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Thermometer className="h-3.5 w-3.5" />
                CPU Temp
              </span>
              <span className="font-mono text-sm">
                {stats.cpu_temp}°{stats.cpu_temp_unit.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Uptime
              </span>
              <span className="text-xs font-mono">{uptime}</span>
            </div>
            {stats.sd_card_used !== undefined && (
              <StatBar
                icon={MemoryStick}
                label="SD Card"
                value={stats.sd_card_used}
                unit="%"
                color="default"
              />
            )}
          </>
        ) : (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-6 bg-muted rounded animate-pulse"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatBar({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  unit: string;
  color: "default" | "destructive";
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="font-mono text-sm">
          {value}
          {unit}
        </span>
      </div>
      <Progress
        value={value}
        className={
          color === "destructive" ? "[&>div]:bg-destructive" : ""
        }
      />
    </div>
  );
}

function formatUptime(isoDate: string): string {
  try {
    const start = new Date(isoDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    parts.push(`${mins}m`);
    return parts.join(" ");
  } catch {
    return isoDate;
  }
}
