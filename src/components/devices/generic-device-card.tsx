"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu } from "lucide-react";
import { getCategoryLabel } from "@/lib/device-helpers";
import type { CubeDevice } from "@/lib/types";

export function GenericDeviceCard({ device }: { device: CubeDevice }) {
  const online = device.online;

  return (
    <Card className={!online ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Cpu className="h-4 w-4 text-muted-foreground" />
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
      <CardContent>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Category</span>
            <span>{getCategoryLabel(device.display_category)}</span>
          </div>
          <div className="flex justify-between">
            <span>Capabilities</span>
            <span>{device.capabilities.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Serial</span>
            <span className="font-mono truncate max-w-[140px]">
              {device.serial_number}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
