"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Grid2x2,
  EyeOff,
} from "lucide-react";
import { SwitchCard } from "@/components/devices/switch-card";
import { LightCard } from "@/components/devices/light-card";
import { SensorCard } from "@/components/devices/sensor-card";
import { GenericDeviceCard } from "@/components/devices/generic-device-card";
import { isSwitchLike, isLight, isSensor, getStateValue, hasCapability } from "@/lib/device-helpers";
import { useDevices } from "@/components/providers/device-provider";
import type { CubeDevice, TemperatureState, HumidityState, PowerState, ToggleState } from "@/lib/types";
import type { Widget, WidgetView } from "@/lib/widgets";

interface WidgetCardProps {
  widget: Widget;
  devices: CubeDevice[];
  onEdit: (widget: Widget) => void;
  onDelete: (widgetId: string) => void;
  onToggleCollapse: (widgetId: string) => void;
  onHide: (widgetId: string) => void;
}

function DeviceCardFull({ device }: { device: CubeDevice }) {
  if (isSwitchLike(device)) return <SwitchCard device={device} />;
  if (isLight(device)) return <LightCard device={device} />;
  if (isSensor(device)) return <SensorCard device={device} />;
  return <GenericDeviceCard device={device} />;
}

function DeviceListRow({ device }: { device: CubeDevice }) {
  const { updateDeviceOptimistic } = useDevices();
  const [loading, setLoading] = useState(false);
  const online = device.online;
  const isControllable = hasCapability(device, "power") || hasCapability(device, "toggle");

  // Get primary value
  let primaryValue = "";
  if (hasCapability(device, "temperature")) {
    const t = getStateValue<TemperatureState>(device, "temperature");
    if (t?.temperature !== undefined) primaryValue = `${t.temperature}°C`;
  }
  if (hasCapability(device, "humidity")) {
    const h = getStateValue<HumidityState>(device, "humidity");
    if (h?.humidity !== undefined) {
      primaryValue += (primaryValue ? " / " : "") + `${h.humidity}%`;
    }
  }

  let isPowered = false;
  if (isControllable) {
    const p = getStateValue<PowerState>(device, "power");
    const t = getStateValue<ToggleState>(device, "toggle");
    isPowered = p?.powerState === "on" || t?.toggleState === "on";
    if (!primaryValue) primaryValue = isPowered ? "On" : "Off";
  }

  const handleToggle = async (checked: boolean) => {
    if (loading || !online) return;
    setLoading(true);
    const newState = checked ? "on" : "off";
    const capability = hasCapability(device, "power") ? "power" : "toggle";
    const statePayload = capability === "power" ? { powerState: newState } : { toggleState: newState };
    try {
      updateDeviceOptimistic(device.serial_number, { [capability]: statePayload });
      const res = await fetch(`/api/devices/${device.serial_number}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: { [capability]: statePayload } }),
      });
      if (!res.ok) {
        const revert = capability === "power" ? { powerState: checked ? "off" : "on" } : { toggleState: checked ? "off" : "on" };
        updateDeviceOptimistic(device.serial_number, { [capability]: revert });
      }
    } catch {
      const revert = capability === "power" ? { powerState: checked ? "off" : "on" } : { toggleState: checked ? "off" : "on" };
      updateDeviceOptimistic(device.serial_number, { [capability]: revert });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-md border ${!online ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-2 w-2 rounded-full shrink-0 ${online ? "bg-green-500" : "bg-muted-foreground"}`} />
        <span className="text-sm truncate">{device.name}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {primaryValue && !isControllable && (
          <span className="text-sm font-mono font-medium">{primaryValue}</span>
        )}
        {isControllable && (
          <Switch
            checked={isPowered}
            onCheckedChange={handleToggle}
            disabled={!online || loading}
          />
        )}
        <Badge
          variant={online ? "default" : "secondary"}
          className="text-[10px] px-1.5"
        >
          {online ? "Online" : "Offline"}
        </Badge>
      </div>
    </div>
  );
}

function DeviceCompactTile({ device }: { device: CubeDevice }) {
  const { updateDeviceOptimistic } = useDevices();
  const [loading, setLoading] = useState(false);
  const online = device.online;
  const isControllable = hasCapability(device, "power") || hasCapability(device, "toggle");

  let primaryValue = "";
  let isPowered = false;

  if (hasCapability(device, "temperature")) {
    const t = getStateValue<TemperatureState>(device, "temperature");
    if (t?.temperature !== undefined) primaryValue = `${t.temperature}°C`;
  } else if (hasCapability(device, "humidity")) {
    const h = getStateValue<HumidityState>(device, "humidity");
    if (h?.humidity !== undefined) primaryValue = `${h.humidity}%`;
  }

  if (isControllable) {
    const p = getStateValue<PowerState>(device, "power");
    const t = getStateValue<ToggleState>(device, "toggle");
    isPowered = p?.powerState === "on" || t?.toggleState === "on";
  }

  const handleToggle = async (checked: boolean) => {
    if (loading || !online) return;
    setLoading(true);
    const newState = checked ? "on" : "off";
    const capability = hasCapability(device, "power") ? "power" : "toggle";
    const statePayload = capability === "power" ? { powerState: newState } : { toggleState: newState };
    try {
      updateDeviceOptimistic(device.serial_number, { [capability]: statePayload });
      const res = await fetch(`/api/devices/${device.serial_number}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: { [capability]: statePayload } }),
      });
      if (!res.ok) {
        const revert = capability === "power" ? { powerState: checked ? "off" : "on" } : { toggleState: checked ? "off" : "on" };
        updateDeviceOptimistic(device.serial_number, { [capability]: revert });
      }
    } catch {
      const revert = capability === "power" ? { powerState: checked ? "off" : "on" } : { toggleState: checked ? "off" : "on" };
      updateDeviceOptimistic(device.serial_number, { [capability]: revert });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-md border text-center min-h-18 ${!online ? "opacity-60" : ""}`}>
      <div className={`h-1.5 w-1.5 rounded-full mb-1 ${online ? "bg-green-500" : "bg-muted-foreground"}`} />
      <span className="text-xs truncate w-full">{device.name}</span>
      {isControllable ? (
        <div className="mt-1.5">
          <Switch
            checked={isPowered}
            onCheckedChange={handleToggle}
            disabled={!online || loading}
          />
        </div>
      ) : primaryValue ? (
        <span className="text-sm font-mono font-semibold mt-0.5">{primaryValue}</span>
      ) : null}
    </div>
  );
}

const viewIcons: Record<WidgetView, typeof LayoutGrid> = {
  grid: LayoutGrid,
  list: List,
  compact: Grid2x2,
};

export function WidgetCard({ widget, devices, onEdit, onDelete, onToggleCollapse, onHide }: WidgetCardProps) {
  // Filter devices for this widget
  const filteredDevices =
    widget.deviceSerialNumbers.length === 0
      ? devices
      : devices.filter((d) => widget.deviceSerialNumbers.includes(d.serial_number));

  const onlineCount = filteredDevices.filter((d) => d.online).length;
  const ViewIcon = viewIcons[widget.view];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => onToggleCollapse(widget.id)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
            >
              {widget.collapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
            <CardTitle className="text-sm font-medium truncate">
              {widget.name}
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
              {onlineCount}/{filteredDevices.length}
            </Badge>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <ViewIcon className="h-3.5 w-3.5 text-muted-foreground mr-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 touch-manipulation"
              onClick={() => onEdit(widget)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 touch-manipulation"
              onClick={() => onHide(widget.id)}
              title="Hide widget"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </Button>
            {widget.id !== "default" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive touch-manipulation"
                onClick={() => onDelete(widget.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {!widget.collapsed && (
        <CardContent>
          {filteredDevices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No devices selected
            </p>
          ) : widget.view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredDevices.map((device) => (
                <DeviceCardFull key={device.serial_number} device={device} />
              ))}
            </div>
          ) : widget.view === "list" ? (
            <div className="space-y-1.5">
              {filteredDevices.map((device) => (
                <DeviceListRow key={device.serial_number} device={device} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {filteredDevices.map((device) => (
                <DeviceCompactTile key={device.serial_number} device={device} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
