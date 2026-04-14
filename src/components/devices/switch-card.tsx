"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Power,
  Plug,
  Thermometer,
  Droplets,
  Wifi,
  Settings2,
} from "lucide-react";
import { useDevices } from "@/components/providers/device-provider";
import { getStateValue, hasCapability } from "@/lib/device-helpers";
import type {
  CubeDevice,
  ToggleState,
  PowerState,
  TemperatureState,
  HumidityState,
} from "@/lib/types";

export function SwitchCard({ device }: { device: CubeDevice }) {
  const { updateDeviceOptimistic } = useDevices();
  const [loading, setLoading] = useState(false);

  const online = device.online;

  // Determine current power state - check "power" first, then "toggle"
  let isPowered = false;
  if (hasCapability(device, "power")) {
    const powerState = getStateValue<PowerState>(device, "power");
    isPowered = powerState?.powerState === "on";
  } else if (hasCapability(device, "toggle")) {
    const toggleState = getStateValue<ToggleState>(device, "toggle");
    isPowered = toggleState?.toggleState === "on";
  }

  // Read sensor values when the switch also has temp/humidity capabilities
  const tempState = getStateValue<TemperatureState>(device, "temperature");
  const humidityState = getStateValue<HumidityState>(device, "humidity");
  const rssiState = getStateValue<{ rssi: number }>(device, "rssi");
  const modeState = device.state?.mode as
    | Record<string, { modeValue?: string }>
    | undefined;
  const thermostatMode = modeState?.thermostatMode?.modeValue;

  const temp = tempState?.temperature;
  const humidity = humidityState?.humidity;
  const rssi = rssiState?.rssi;

  const hasSensorData =
    hasCapability(device, "temperature") || hasCapability(device, "humidity");

  const handleToggle = async (checked: boolean) => {
    if (loading || !online) return;
    setLoading(true);

    const newState = checked ? "on" : "off";
    const capability = hasCapability(device, "power") ? "power" : "toggle";
    const statePayload =
      capability === "power"
        ? { powerState: newState }
        : { toggleState: newState };

    try {
      updateDeviceOptimistic(device.serial_number, {
        [capability]: statePayload,
      });

      const res = await fetch(`/api/devices/${device.serial_number}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: { [capability]: statePayload },
        }),
      });

      if (!res.ok) {
        const revert =
          capability === "power"
            ? { powerState: checked ? "off" : "on" }
            : { toggleState: checked ? "off" : "on" };
        updateDeviceOptimistic(device.serial_number, { [capability]: revert });
      }
    } catch {
      const revert =
        capability === "power"
          ? { powerState: checked ? "off" : "on" }
          : { toggleState: checked ? "off" : "on" };
      updateDeviceOptimistic(device.serial_number, { [capability]: revert });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={!online ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Plug className="h-4 w-4 text-primary" />
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
        {/* Power toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Power
              className={`h-4 w-4 ${isPowered ? "text-green-500" : ""}`}
            />
            {isPowered ? "On" : "Off"}
          </div>
          <Switch
            checked={isPowered}
            onCheckedChange={handleToggle}
            disabled={!online || loading}
          />
        </div>

        {/* Sensor readings (temp/humidity/mode) */}
        {hasSensorData && (
          <div className="border-t pt-3 space-y-2">
            {temp !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Thermometer className="h-3.5 w-3.5" />
                  Temperature
                </span>
                <span
                  className={`font-mono font-semibold ${
                    temp > 30
                      ? "text-red-500"
                      : temp < 10
                        ? "text-blue-500"
                        : "text-foreground"
                  }`}
                >
                  {temp}°C
                </span>
              </div>
            )}

            {humidity !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Droplets className="h-3.5 w-3.5" />
                  Humidity
                </span>
                <span
                  className={`font-mono font-semibold ${
                    humidity > 70
                      ? "text-blue-500"
                      : humidity < 30
                        ? "text-orange-500"
                        : "text-foreground"
                  }`}
                >
                  {humidity}%
                </span>
              </div>
            )}

            {thermostatMode && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Settings2 className="h-3.5 w-3.5" />
                  Mode
                </span>
                <span className="font-mono font-semibold capitalize text-foreground">
                  {thermostatMode}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Signal strength */}
        {rssi !== undefined && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Wifi className="h-3 w-3" />
              Signal
            </span>
            <span className="font-mono">
              {rssi} dBm
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
