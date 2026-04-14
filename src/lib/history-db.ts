import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const dbPath = path.join(process.cwd(), "history.db");
  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial_number TEXT NOT NULL,
      device_name TEXT NOT NULL,
      capability TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT '',
      recorded_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_readings_device_time
      ON readings (serial_number, capability, recorded_at);

    CREATE INDEX IF NOT EXISTS idx_readings_time
      ON readings (recorded_at);
  `);

  return db;
}

export interface Reading {
  id: number;
  serial_number: string;
  device_name: string;
  capability: string;
  value: number;
  unit: string;
  recorded_at: number;
}

/**
 * Record all sensor readings from a device snapshot.
 * Extracts temperature, humidity, battery, rssi, etc.
 */
export function recordDeviceSnapshot(device: {
  serial_number: string;
  name: string;
  state: Record<string, Record<string, unknown>>;
  online: boolean;
}): number {
  if (!device.online) return 0;

  const d = getDb();
  const stmt = d.prepare(
    `INSERT INTO readings (serial_number, device_name, capability, value, unit, recorded_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const now = Date.now();
  let count = 0;

  const insertRow = d.transaction(
    (
      rows: { capability: string; value: number; unit: string }[]
    ) => {
      for (const row of rows) {
        stmt.run(
          device.serial_number,
          device.name,
          row.capability,
          row.value,
          row.unit,
          now
        );
        count++;
      }
    }
  );

  const rows: { capability: string; value: number; unit: string }[] = [];

  const state = device.state;
  if (state?.temperature?.temperature != null) {
    rows.push({
      capability: "temperature",
      value: state.temperature.temperature as number,
      unit: "°C",
    });
  }
  if (state?.humidity?.humidity != null) {
    rows.push({
      capability: "humidity",
      value: state.humidity.humidity as number,
      unit: "%",
    });
  }
  if (state?.battery?.battery != null) {
    rows.push({
      capability: "battery",
      value: state.battery.battery as number,
      unit: "%",
    });
  }
  if (state?.rssi?.rssi != null) {
    rows.push({
      capability: "rssi",
      value: state.rssi.rssi as number,
      unit: "dBm",
    });
  }
  if (state?.voltage?.voltage != null) {
    rows.push({
      capability: "voltage",
      value: state.voltage.voltage as number,
      unit: "V",
    });
  }
  if (state?.["electric-power"]?.["electric-power"] != null) {
    rows.push({
      capability: "electric-power",
      value: state["electric-power"]["electric-power"] as number,
      unit: "W",
    });
  }

  if (rows.length > 0) {
    insertRow(rows);
  }

  return count;
}

/**
 * Get readings for a device + capability within a time range
 */
export function getReadings(
  serialNumber: string,
  capability: string,
  fromMs: number,
  toMs: number,
  limit: number = 2000
): Reading[] {
  const d = getDb();
  const stmt = d.prepare(
    `SELECT id, serial_number, device_name, capability, value, unit, recorded_at
     FROM readings
     WHERE serial_number = ? AND capability = ?
       AND recorded_at >= ? AND recorded_at <= ?
     ORDER BY recorded_at ASC
     LIMIT ?`
  );
  return stmt.all(serialNumber, capability, fromMs, toMs, limit) as Reading[];
}

/**
 * Get all device serial numbers that have history
 */
export function getDevicesWithHistory(): {
  serial_number: string;
  device_name: string;
  capabilities: string[];
}[] {
  const d = getDb();
  const stmt = d.prepare(
    `SELECT DISTINCT serial_number, device_name, capability
     FROM readings
     ORDER BY device_name, capability`
  );
  const rows = stmt.all() as {
    serial_number: string;
    device_name: string;
    capability: string;
  }[];

  const map = new Map<
    string,
    { serial_number: string; device_name: string; capabilities: string[] }
  >();

  for (const row of rows) {
    let entry = map.get(row.serial_number);
    if (!entry) {
      entry = {
        serial_number: row.serial_number,
        device_name: row.device_name,
        capabilities: [],
      };
      map.set(row.serial_number, entry);
    }
    entry.capabilities.push(row.capability);
  }

  return Array.from(map.values());
}

/**
 * Get the latest reading per device per capability
 */
export function getLatestReadings(): Reading[] {
  const d = getDb();
  const stmt = d.prepare(
    `SELECT r.id, r.serial_number, r.device_name, r.capability, r.value, r.unit, r.recorded_at
     FROM readings r
     INNER JOIN (
       SELECT serial_number, capability, MAX(recorded_at) as max_time
       FROM readings
       GROUP BY serial_number, capability
     ) latest ON r.serial_number = latest.serial_number
       AND r.capability = latest.capability
       AND r.recorded_at = latest.max_time`
  );
  return stmt.all() as Reading[];
}

/**
 * Get the total count of readings
 */
export function getReadingCount(): number {
  const d = getDb();
  const stmt = d.prepare("SELECT COUNT(*) as cnt FROM readings");
  const row = stmt.get() as { cnt: number };
  return row.cnt;
}


