"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Globe, Cpu, HardDrive } from "lucide-react";
import type { GatewayInfo } from "@/lib/types";

export function GatewayInfoCard() {
  const [info, setInfo] = useState<GatewayInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gateway/info")
      .then((r) => r.json())
      .then((json) => {
        if (json.error === 0 && json.data) {
          setInfo(json.data);
        } else {
          setError(json.message || "Failed to load");
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Gateway
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Server className="h-4 w-4 text-primary" />
          Gateway Info
        </CardTitle>
        <CardDescription>
          {info ? info.name : "Loading..."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {info ? (
          <>
            <InfoRow icon={Globe} label="IP" value={info.ip} />
            <InfoRow icon={HardDrive} label="MAC" value={info.mac} />
            <InfoRow icon={Cpu} label="Firmware" value={info.fw_version} />
            {info.domain && (
              <InfoRow icon={Globe} label="Domain" value={info.domain} />
            )}
          </>
        ) : (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-5 bg-muted rounded animate-pulse"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <Badge variant="secondary" className="font-mono text-xs">
        {value}
      </Badge>
    </div>
  );
}
