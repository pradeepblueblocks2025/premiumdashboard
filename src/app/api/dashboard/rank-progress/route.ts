import { fetchRankDetail, fetchRankProgress } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

function tokenFromRequest(request: NextRequest): string {
  const header = request.headers.get("Authorization");
  if (header) {
    return header.replace(/^Bearer\s+/i, "").trim();
  }
  return process.env.API_TOKEN ?? "";
}

export async function GET(request: NextRequest) {
  try {
    const token = tokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        {
          error:
            "No authentication token. Visit /login/{token} or set API_TOKEN in .env.local",
        },
        { status: 401 }
      );
    }

    const rank = request.nextUrl.searchParams.get("rank");

    if (rank) {
      const data = await fetchRankDetail(rank, token);
      return NextResponse.json(data);
    }

    const data = await fetchRankProgress(token);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    const status = message.includes("(401)") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
