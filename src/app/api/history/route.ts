import { NextRequest, NextResponse } from "next/server";
import {
  getReadings,
  getDevicesWithHistory,
  getLatestReadings,
  getReadingCount,
} from "@/lib/history-db";

/**
 * GET /api/history
 * Query params:
 *   - serial_number: device serial (required for readings)
 *   - capability: e.g. "temperature", "humidity" (required for readings)
 *   - range: "1h" | "6h" | "24h" | "7d" | "30d" (default: "24h")
 *   - action: "devices" | "latest" | "stats" | (omit for readings)
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const action = sp.get("action");

    // List devices that have history
    if (action === "devices") {
      const devices = getDevicesWithHistory();
      return NextResponse.json({ error: 0, data: devices, message: "success" });
    }

    // Latest reading per device/capability
    if (action === "latest") {
      const latest = getLatestReadings();
      return NextResponse.json({ error: 0, data: latest, message: "success" });
    }

    // Stats
    if (action === "stats") {
      const count = getReadingCount();
      return NextResponse.json({
        error: 0,
        data: { total_readings: count },
        message: "success",
      });
    }

    // Readings for a specific device + capability
    const serialNumber = sp.get("serial_number");
    const capability = sp.get("capability");

    if (!serialNumber || !capability) {
      return NextResponse.json(
        {
          error: 400,
          data: {},
          message: "serial_number and capability are required",
        },
        { status: 400 }
      );
    }

    const range = sp.get("range") || "24h";
    const now = Date.now();
    const rangeMs: Record<string, number> = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    const fromMs = now - (rangeMs[range] || rangeMs["24h"]);

    const readings = getReadings(serialNumber, capability, fromMs, now);

    return NextResponse.json({
      error: 0,
      data: { readings, range, count: readings.length },
      message: "success",
    });
  } catch (e) {
    return NextResponse.json(
      { error: 500, data: {}, message: (e as Error).message },
      { status: 500 }
    );
  }
}
