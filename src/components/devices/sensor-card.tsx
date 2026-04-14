"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Thermometer,
  Droplets,
  BatteryMedium,
  Activity,
} from "lucide-react";
import { getStateValue, hasCapability } from "@/lib/device-helpers";
import type {
  CubeDevice,
  TemperatureState,
  HumidityState,
  BatteryState,
} from "@/lib/types";

export function SensorCard({ device }: { device: CubeDevice }) {
  const online = device.online;

  const tempState = getStateValue<TemperatureState>(device, "temperature");
  const humidityState = getStateValue<HumidityState>(device, "humidity");
  const batteryState = getStateValue<BatteryState>(device, "battery");

  const temp = tempState?.temperature;
  const humidity = humidityState?.humidity;
  const battery = batteryState?.battery;

  return (
    <Card className={!online ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4 text-primary" />
            <span className="truncate">{device.name}</span>
          </CardTitle>
          <Badge
            variant={online ? "default" : "secondary"}
            className="text-[10px] px-1.5"
          >
            {online ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasCapability(device, "temperature") && temp !== undefined && (
          <SensorRow
            icon={Thermometer}
            label="Temperature"
            value={`${temp}°C`}
            color={
              temp > 30
                ? "text-red-500"
                : temp < 10
                  ? "text-blue-500"
                  : "text-foreground"
            }
          />
        )}

        {hasCapability(device, "humidity") && humidity !== undefined && (
          <SensorRow
            icon={Droplets}
            label="Humidity"
            value={`${humidity}%`}
            color={
              humidity > 70
                ? "text-blue-500"
                : humidity < 30
                  ? "text-orange-500"
                  : "text-foreground"
            }
          />
        )}

        {hasCapability(device, "battery") && battery !== undefined && (
          <SensorRow
            icon={BatteryMedium}
            label="Battery"
            value={`${battery}%`}
            color={
              battery < 20
                ? "text-red-500"
                : battery < 50
                  ? "text-yellow-500"
                  : "text-green-500"
            }
          />
        )}

        {/* If sensor has no recognized values yet */}
        {temp === undefined &&
          humidity === undefined &&
          battery === undefined && (
            <p className="text-xs text-muted-foreground">
              Waiting for sensor data...
            </p>
          )}
      </CardContent>
    </Card>
  );
}

function SensorRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className={`font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}
