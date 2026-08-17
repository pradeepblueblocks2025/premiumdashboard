import { fetchDashboardSection } from "@/lib/sectionApi";
import type { DashboardSectionId } from "@/lib/dashboardSections";
import { NextRequest, NextResponse } from "next/server";

function tokenFromRequest(request: NextRequest): string {
  const header = request.headers.get("Authorization");
  if (header) {
    return header.replace(/^Bearer\s+/i, "").trim();
  }
  return process.env.API_TOKEN ?? "";
}

const VALID_SECTIONS = new Set<DashboardSectionId>([
  "community-users",
  "volume-by-level",
  "purchase-stats",
  "financial-stats",
  "customer-stats",
]);

export async function GET(request: NextRequest) {
  try {
    const token = tokenFromRequest(request);
    const section = request.nextUrl.searchParams.get(
      "section"
    ) as DashboardSectionId | null;

    if (!token) {
      return NextResponse.json(
        { error: "No authentication token configured." },
        { status: 401 }
      );
    }

    if (!section || !VALID_SECTIONS.has(section)) {
      return NextResponse.json(
        { error: "Invalid or missing section parameter." },
        { status: 400 }
      );
    }

    const data = await fetchDashboardSection(section, token);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
