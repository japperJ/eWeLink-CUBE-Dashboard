"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCategoryLabel } from "@/lib/device-helpers";
import type { CubeDevice } from "@/lib/types";
import type { Widget, WidgetView } from "@/lib/widgets";
import {
  LayoutGrid,
  List,
  Grid2x2,
  Search,
  Thermometer,
  ToggleLeft,
  Lightbulb,
  Cpu,
  Radio,
  Eye,
  Droplets,
  Zap,
} from "lucide-react";

interface WidgetEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widget: Widget | null;
  devices: CubeDevice[];
  onSave: (name: string, view: WidgetView, deviceSerialNumbers: string[]) => void;
}

const viewOptions: {
  value: WidgetView;
  label: string;
  desc: string;
  icon: typeof LayoutGrid;
}[] = [
  { value: "grid", label: "Grid", desc: "Full cards with controls", icon: LayoutGrid },
  { value: "list", label: "List", desc: "Compact rows", icon: List },
  { value: "compact", label: "Compact", desc: "Dense tile overview", icon: Grid2x2 },
];

const categoryIcons: Record<string, typeof Cpu> = {
  temperatureAndHumiditySensor: Thermometer,
  temperatureSensor: Thermometer,
  humiditySensor: Droplets,
  switch: ToggleLeft,
  plug: Zap,
  light: Lightbulb,
  fanLight: Lightbulb,
  button: Radio,
  motionSensor: Eye,
  contactSensor: Eye,
};

export function WidgetEditDialog({
  open,
  onOpenChange,
  widget,
  devices,
  onSave,
}: WidgetEditDialogProps) {
  const [name, setName] = useState("");
  const [view, setView] = useState<WidgetView>("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allDevices, setAllDevices] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setSearch("");
      if (widget) {
        setName(widget.name);
        setView(widget.view);
        const isAll = widget.deviceSerialNumbers.length === 0;
        setAllDevices(isAll);
        setSelected(
          new Set(isAll ? devices.map((d) => d.serial_number) : widget.deviceSerialNumbers)
        );
      } else {
        setName("");
        setView("grid");
        setAllDevices(true);
        setSelected(new Set(devices.map((d) => d.serial_number)));
      }
    }
  }, [open, widget, devices]);

  // Group & filter devices
  const grouped = useMemo(() => {
    const g: Record<string, CubeDevice[]> = {};
    const q = search.toLowerCase();
    for (const d of devices) {
      if (q && !d.name.toLowerCase().includes(q)) continue;
      const cat = d.display_category;
      if (!g[cat]) g[cat] = [];
      g[cat].push(d);
    }
    return g;
  }, [devices, search]);

  const visibleCount = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);

  const toggleDevice = (serial: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(serial)) next.delete(serial);
      else next.add(serial);
      return next;
    });
    setAllDevices(false);
  };

  const toggleAll = () => {
    if (allDevices) {
      setAllDevices(false);
      setSelected(new Set());
    } else {
      setAllDevices(true);
      setSelected(new Set(devices.map((d) => d.serial_number)));
    }
  };

  const toggleCategory = (category: string) => {
    const catDevices = grouped[category] || [];
    const allSelected = catDevices.every((d) => selected.has(d.serial_number));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const d of catDevices) {
        if (allSelected) next.delete(d.serial_number);
        else next.add(d.serial_number);
      }
      return next;
    });
    setAllDevices(false);
  };

  const handleSave = () => {
    const finalName = name.trim() || "Untitled Widget";
    const serials = allDevices ? [] : Array.from(selected);
    onSave(finalName, view, serials);
    onOpenChange(false);
  };

  const selectionCount = allDevices ? devices.length : selected.size;
  const selectionPct = devices.length > 0 ? (selectionCount / devices.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header with accent bar */}
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-primary/60 via-primary to-primary/60" />
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-base tracking-tight">
              {widget ? "Edit Widget" : "New Widget"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Choose a layout and pick which devices appear in this widget.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-5 pb-4 space-y-5">
          {/* Name input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Widget Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Living Room, Sensors, Upstairs…"
              className="h-9 text-sm"
            />
          </div>

          {/* View selector — card-style radio */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Layout
            </label>
            <div className="grid grid-cols-3 gap-2">
              {viewOptions.map((opt) => {
                const Icon = opt.icon;
                const active = view === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setView(opt.value)}
                    className={`group relative flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${
                      active
                        ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium transition-colors ${
                        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="text-[10px] leading-tight text-muted-foreground hidden sm:block">
                      {opt.desc}
                    </span>
                    {/* Active indicator dot */}
                    {active && (
                      <div className="absolute -top-px -right-px h-2 w-2 rounded-full bg-primary ring-2 ring-popover" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Device selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Devices
              </label>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {selectionCount}/{devices.length} selected
              </span>
            </div>

            {/* Selection progress bar */}
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${selectionPct}%` }}
              />
            </div>

            {/* All-devices toggle */}
            <label className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/50">
              <Checkbox checked={allDevices} onCheckedChange={toggleAll} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">All Devices</span>
                <span className="text-xs text-muted-foreground ml-1.5">
                  ({devices.length})
                </span>
              </div>
              {allDevices && (
                <span className="shrink-0 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </label>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter devices…"
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Device list */}
            <div className="rounded-lg border bg-muted/20 overflow-hidden">
              <ScrollArea className="h-52">
                <div className="p-1.5 space-y-0.5">
                  {Object.keys(grouped).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No devices match &ldquo;{search}&rdquo;
                    </p>
                  )}

                  {Object.keys(grouped).map((category) => {
                    const catDevices = grouped[category];
                    const catAllSelected = catDevices.every((d) =>
                      selected.has(d.serial_number)
                    );
                    const catSomeSelected =
                      !catAllSelected &&
                      catDevices.some((d) => selected.has(d.serial_number));
                    const CatIcon = categoryIcons[category] || Cpu;
                    const selectedInCat = catDevices.filter((d) =>
                      selected.has(d.serial_number)
                    ).length;

                    return (
                      <div key={category}>
                        {/* Category header */}
                        <label className="flex items-center gap-2.5 px-2 py-1.5 cursor-pointer rounded-md transition-colors hover:bg-muted/60">
                          <Checkbox
                            checked={catAllSelected}
                            indeterminate={catSomeSelected}
                            onCheckedChange={() => toggleCategory(category)}
                          />
                          <CatIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="flex-1 text-xs font-semibold tracking-wide text-muted-foreground">
                            {getCategoryLabel(category)}
                          </span>
                          <span className="text-[10px] tabular-nums text-muted-foreground">
                            {selectedInCat}/{catDevices.length}
                          </span>
                        </label>

                        {/* Devices */}
                        {catDevices.map((device) => {
                          const isChecked = selected.has(device.serial_number);
                          return (
                            <label
                              key={device.serial_number}
                              className={`flex items-center gap-2.5 pl-8 pr-2 py-1.5 cursor-pointer rounded-md transition-colors ${
                                isChecked
                                  ? "bg-primary/5 hover:bg-primary/8"
                                  : "hover:bg-muted/50"
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleDevice(device.serial_number)}
                              />
                              <span className="flex-1 text-sm truncate">{device.name}</span>
                              <span
                                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                  device.online ? "bg-emerald-500" : "bg-muted-foreground/40"
                                }`}
                              />
                            </label>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="rounded-b-xl!">
          <DialogClose render={<Button variant="outline" size="sm" />}>
            Cancel
          </DialogClose>
          <Button size="sm" onClick={handleSave}>
            {widget ? "Save Changes" : "Add Widget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
