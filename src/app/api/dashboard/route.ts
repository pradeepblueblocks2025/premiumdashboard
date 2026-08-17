import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Monolithic dashboard API is disabled. Sections load via /api/dashboard/section?section=...",
    },
    { status: 410 }
  );
}
