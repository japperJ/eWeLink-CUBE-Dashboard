"use client";

import { useState, useEffect, useCallback } from "react";
import { useDevices } from "@/components/providers/device-provider";
import { WidgetCard } from "@/components/widgets/widget-card";
import { WidgetEditDialog } from "@/components/widgets/widget-edit-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Eye, EyeOff } from "lucide-react";
import {
  loadWidgets,
  saveWidgets,
  createWidget,
  type Widget,
  type WidgetView,
} from "@/lib/widgets";

const HIDDEN_COOKIE = "ewelink-hidden-widgets";

function getHiddenWidgets(): Set<string> {
  if (typeof document === "undefined") return new Set();
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${HIDDEN_COOKIE}=`));
  if (!match) return new Set();
  try {
    const val = decodeURIComponent(match.split("=")[1]);
    const arr = JSON.parse(val);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function setHiddenWidgetsCookie(ids: Set<string>): void {
  if (typeof document === "undefined") return;
  const val = JSON.stringify(Array.from(ids));
  // Cookie valid for 1 year
  document.cookie = `${HIDDEN_COOKIE}=${encodeURIComponent(val)};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

export function DashboardWidgets() {
  const { devices, loading, error } = useDevices();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);

  // Load widgets from localStorage + hidden state from cookie on mount
  useEffect(() => {
    setWidgets(loadWidgets());
    setHiddenIds(getHiddenWidgets());
    setMounted(true);
  }, []);

  // Persist whenever widgets change (after mount)
  useEffect(() => {
    if (mounted) {
      saveWidgets(widgets);
    }
  }, [widgets, mounted]);

  const handleAddWidget = () => {
    setEditingWidget(null);
    setDialogOpen(true);
  };

  const handleEditWidget = useCallback((widget: Widget) => {
    setEditingWidget(widget);
    setDialogOpen(true);
  }, []);

  const handleSaveWidget = useCallback(
    (name: string, view: WidgetView, deviceSerialNumbers: string[]) => {
      setWidgets((prev) => {
        if (editingWidget) {
          return prev.map((w) =>
            w.id === editingWidget.id
              ? { ...w, name, view, deviceSerialNumbers }
              : w
          );
        }
        return [...prev, createWidget(name, view, deviceSerialNumbers)];
      });
    },
    [editingWidget]
  );

  const handleDeleteWidget = useCallback((widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    setHiddenIds((prev) => {
      if (prev.has(widgetId)) {
        const next = new Set(prev);
        next.delete(widgetId);
        setHiddenWidgetsCookie(next);
        return next;
      }
      return prev;
    });
  }, []);

  const handleToggleCollapse = useCallback((widgetId: string) => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === widgetId ? { ...w, collapsed: !w.collapsed } : w
      )
    );
  }, []);

  const handleHideWidget = useCallback((widgetId: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(widgetId);
      setHiddenWidgetsCookie(next);
      return next;
    });
  }, []);

  const handleUnhideWidget = useCallback((widgetId: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(widgetId);
      setHiddenWidgetsCookie(next);
      return next;
    });
  }, []);

  const hiddenCount = widgets.filter((w) => hiddenIds.has(w.id)).length;
  const visibleWidgets = widgets.filter((w) => !hiddenIds.has(w.id));
  const hiddenWidgets = widgets.filter((w) => hiddenIds.has(w.id));

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

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {visibleWidgets.length} widget{visibleWidgets.length !== 1 ? "s" : ""}
          </p>
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowHidden(!showHidden)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {hiddenCount} hidden
            </button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleAddWidget}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Widget
        </Button>
      </div>

      {/* Hidden widgets panel */}
      {showHidden && hiddenWidgets.length > 0 && (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Hidden Widgets</p>
          <div className="flex flex-wrap gap-2">
            {hiddenWidgets.map((w) => (
              <button
                key={w.id}
                onClick={() => handleUnhideWidget(w.id)}
                className="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
              >
                <Eye className="h-3 w-3 text-muted-foreground" />
                {w.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {visibleWidgets.map((widget) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            devices={devices}
            onEdit={handleEditWidget}
            onDelete={handleDeleteWidget}
            onToggleCollapse={handleToggleCollapse}
            onHide={handleHideWidget}
          />
        ))}
      </div>

      <WidgetEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        widget={editingWidget}
        devices={devices}
        onSave={handleSaveWidget}
      />
    </>
  );
}
