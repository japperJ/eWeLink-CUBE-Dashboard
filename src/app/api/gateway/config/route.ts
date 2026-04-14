import { setGatewayVolume, muteGateway, unmuteGateway } from "@/lib/cube-api";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, volume } = body as {
      action?: "mute" | "unmute" | "volume";
      volume?: number;
    };

    let result;
    switch (action) {
      case "mute":
        result = await muteGateway();
        break;
      case "unmute":
        result = await unmuteGateway();
        break;
      case "volume":
        if (volume === undefined) {
          return NextResponse.json(
            { error: 400, data: {}, message: "volume is required" },
            { status: 400 }
          );
        }
        result = await setGatewayVolume(volume);
        break;
      default:
        return NextResponse.json(
          { error: 400, data: {}, message: "invalid action" },
          { status: 400 }
        );
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: 500, data: {}, message: (e as Error).message },
      { status: 500 }
    );
  }
}
