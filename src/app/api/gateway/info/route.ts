import { getGatewayInfo } from "@/lib/cube-api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await getGatewayInfo();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: 500, data: {}, message: (e as Error).message },
      { status: 500 }
    );
  }
}
