"use client";

import { useDevices } from "@/components/providers/device-provider";
import { groupDevicesByCategory, isSwitchLike, isLight, isSensor } from "@/lib/device-helpers";
import { SwitchCard } from "@/components/devices/switch-card";
import { LightCard } from "@/components/devices/light-card";
import { SensorCard } from "@/components/devices/sensor-card";
import { GenericDeviceCard } from "@/components/devices/generic-device-card";
import { getCategoryLabel } from "@/lib/device-helpers";
import type { CubeDevice } from "@/lib/types";
import { Loader2 } from "lucide-react";

function DeviceCard({ device }: { device: CubeDevice }) {
  if (isSwitchLike(device)) return <SwitchCard device={device} />;
  if (isLight(device)) return <LightCard device={device} />;
  if (isSensor(device)) return <SensorCard device={device} />;
  return <GenericDeviceCard device={device} />;
}

export function DeviceList() {
  const { devices, loading, error } = useDevices();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-destructive">{error}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Check your token and gateway connection
        </p>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No devices found</p>
        <p className="text-xs text-muted-foreground mt-1">
          Make sure devices are paired with your CUBE
        </p>
      </div>
    );
  }

  const grouped = groupDevicesByCategory(devices);
  const categories = Object.keys(grouped);

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {getCategoryLabel(category)} ({grouped[category].length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {grouped[category].map((device) => (
              <DeviceCard key={device.serial_number} device={device} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
