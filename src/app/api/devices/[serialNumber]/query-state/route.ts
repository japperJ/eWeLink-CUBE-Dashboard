import { queryDeviceState } from "@/lib/cube-api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ serialNumber: string }> }
) {
  try {
    const { serialNumber } = await params;
    const body = await req.json();
    const { capability, query_state } = body as {
      capability: string;
      query_state: Record<string, unknown>;
    };

    if (!capability || !query_state) {
      return NextResponse.json(
        {
          error: 400,
          data: {},
          message: "capability and query_state are required",
        },
        { status: 400 }
      );
    }

    const result = await queryDeviceState(serialNumber, capability, query_state);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: 500, data: {}, message: (e as Error).message },
      { status: 500 }
    );
  }
}
