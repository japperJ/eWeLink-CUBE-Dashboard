import { NextResponse } from "next/server";
import { getDevices } from "@/lib/cube-api";
import { recordDeviceSnapshot, getReadingCount } from "@/lib/history-db";

/**
 * POST /api/history/record
 * Fetches current device states from the CUBE and records sensor values to the DB.
 * Called periodically by the client (every 5 minutes).
 */
export async function POST() {
  try {
    const result = await getDevices();
    if (result.error !== 0) {
      return NextResponse.json(
        { error: result.error, message: result.message, recorded: 0 },
        { status: 502 }
      );
    }

    const devices = result.data.device_list || [];
    let totalRecorded = 0;

    for (const device of devices) {
      totalRecorded += recordDeviceSnapshot(device);
    }

    const totalReadings = getReadingCount();

    return NextResponse.json({
      error: 0,
      message: "success",
      data: {
        devices_checked: devices.length,
        readings_recorded: totalRecorded,
        total_readings: totalReadings,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: 500, message: (e as Error).message, recorded: 0 },
      { status: 500 }
    );
  }
}
