import { updateDevice } from "@/lib/cube-api";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ serialNumber: string }> }
) {
  try {
    const { serialNumber } = await params;
    const body = await req.json();
    const result = await updateDevice(serialNumber, body);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: 500, data: {}, message: (e as Error).message },
      { status: 500 }
    );
  }
}
