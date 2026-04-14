import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: 400, message: "Token is required" },
        { status: 400 }
      );
    }

    const envPath = join(process.cwd(), ".env");
    let content: string;
    try {
      content = await readFile(envPath, "utf-8");
    } catch {
      content = "";
    }

    // Replace existing CUBE_ACCESS_TOKEN or append it
    if (content.includes("CUBE_ACCESS_TOKEN=")) {
      content = content.replace(
        /CUBE_ACCESS_TOKEN=.*/,
        `CUBE_ACCESS_TOKEN=${token}`
      );
    } else {
      content += `\nCUBE_ACCESS_TOKEN=${token}\n`;
    }

    await writeFile(envPath, content, "utf-8");

    // Also set it in the current process so it takes effect immediately
    process.env.CUBE_ACCESS_TOKEN = token;

    return NextResponse.json({ error: 0, message: "Token saved" });
  } catch (e) {
    return NextResponse.json(
      { error: 500, message: (e as Error).message },
      { status: 500 }
    );
  }
}
