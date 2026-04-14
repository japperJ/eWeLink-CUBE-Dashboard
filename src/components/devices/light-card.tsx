"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sun, Palette } from "lucide-react";
import { useDevices } from "@/components/providers/device-provider";
import { getStateValue, hasCapability } from "@/lib/device-helpers";
import type {
  CubeDevice,
  PowerState,
  BrightnessState,
  ColorTemperatureState,
  ColorRGBState,
} from "@/lib/types";

export function LightCard({ device }: { device: CubeDevice }) {
  const { updateDeviceOptimistic } = useDevices();
  const [loading, setLoading] = useState(false);

  const online = device.online;
  const powerState = getStateValue<PowerState>(device, "power");
  const isPowered = powerState?.powerState === "on";

  const brightnessState = getStateValue<BrightnessState>(device, "brightness");
  const brightness = brightnessState?.brightness ?? 100;

  const ctState = getStateValue<ColorTemperatureState>(
    device,
    "color-temperature"
  );
  const colorTemp = ctState?.colorTemperature ?? 0;

  const rgbState = getStateValue<ColorRGBState>(device, "color-rgb");

  const sendState = useCallback(
    async (capability: string, state: Record<string, unknown>) => {
      setLoading(true);
      try {
        updateDeviceOptimistic(device.serial_number, { [capability]: state });
        await fetch(`/api/devices/${device.serial_number}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            capabilities: [
              { capability, permission: "readWrite", ...state },
            ],
          }),
        });
      } catch {
        // SSE will auto-correct state
      } finally {
        setLoading(false);
      }
    },
    [device.serial_number, updateDeviceOptimistic]
  );

  const handlePowerToggle = (checked: boolean) => {
    sendState("power", { powerState: checked ? "on" : "off" });
  };

  const handleBrightness = (val: number | readonly number[]) => {
    const v = Array.isArray(val) ? val[0] : val;
    sendState("brightness", { brightness: v });
  };

  const handleColorTemp = (val: number | readonly number[]) => {
    const v = Array.isArray(val) ? val[0] : val;
    sendState("color-temperature", { colorTemperature: v });
  };

  return (
    <Card className={!online ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb
              className={`h-4 w-4 ${isPowered ? "text-yellow-400" : "text-muted-foreground"}`}
            />
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
      <CardContent className="space-y-4">
        {/* Power Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Power</span>
          <Switch
            checked={isPowered}
            onCheckedChange={handlePowerToggle}
            disabled={!online || loading}
          />
        </div>

        {/* Brightness Slider */}
        {hasCapability(device, "brightness") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Sun className="h-3.5 w-3.5" />
                Brightness
              </span>
              <span className="font-mono text-xs">{brightness}%</span>
            </div>
            <Slider
              value={[brightness]}
              min={1}
              max={100}
              step={1}
              onValueCommitted={handleBrightness}
              disabled={!online || !isPowered || loading}
            />
          </div>
        )}

        {/* Color Temperature Slider */}
        {hasCapability(device, "color-temperature") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Palette className="h-3.5 w-3.5" />
                Color Temp
              </span>
              <span className="font-mono text-xs">{colorTemp}</span>
            </div>
            <Slider
              value={[colorTemp]}
              min={0}
              max={100}
              step={1}
              onValueCommitted={handleColorTemp}
              disabled={!online || !isPowered || loading}
            />
          </div>
        )}

        {/* RGB indicator */}
        {rgbState && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Palette className="h-3.5 w-3.5" />
              Color
            </span>
            <div
              className="h-6 w-6 rounded-full border"
              style={{
                backgroundColor: `rgb(${rgbState.red ?? 0}, ${rgbState.green ?? 0}, ${rgbState.blue ?? 0})`,
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
