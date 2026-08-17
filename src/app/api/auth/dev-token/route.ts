import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const token = process.env.API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "API_TOKEN is not set" }, { status: 404 });
  }

  return NextResponse.json({ token });
}
