"use client";

import type { DashboardViewModel } from "@/lib/types";
import { fetchBackendJson, getClientAuthToken } from "@/lib/clientApi";
import { getStoredToken } from "@/lib/auth";
import {
  createInitialDashboardViewModel,
  DASHBOARD_SECTION_ORDER,
  EMPTY_DASHBOARD_DATA,
  mergeSectionIntoDashboardData,
  SECTION_LABELS,
  toViewModel,
  type DashboardSectionId,
} from "@/lib/dashboardSections";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const Dashboard = dynamic(() => import("@/components/Dashboard"), {
  loading: () => <DashboardBootScreen message="Loading dashboard UI..." />,
  ssr: false,
});

const SECTION_BACKEND_PATH: Record<DashboardSectionId, string> = {
  "community-users": "/api/v1/premium-dashboard/community-users",
  "volume-by-level": "/api/v1/premium-dashboard/volume-by-level",
  "purchase-stats": "/api/v1/premium-dashboard/purchase-stats",
  "financial-stats": "/api/v1/premium-dashboard/financial-stats",
  "customer-stats": "/api/v1/premium-dashboard/customer-stats",
};

/** Pause between section calls — reduces backend memory spikes for large downlines. */
const SECTION_DELAY_MS = 300;

function DashboardBootScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#070b1a]">
      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

async function fetchSectionClient(
  section: DashboardSectionId
): Promise<Record<string, unknown>> {
  return fetchBackendJson<Record<string, unknown>>(
    SECTION_BACKEND_PATH[section]
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function DashboardLoader() {
  const router = useRouter();
  const authRedirected = useRef(false);
  const [data, setData] = useState<DashboardViewModel | null>(null);
  const [loadingSections, setLoadingSections] = useState<Set<DashboardSectionId>>(
    () => new Set(DASHBOARD_SECTION_ORDER)
  );
  const [sectionErrors, setSectionErrors] = useState<
    Partial<Record<DashboardSectionId, string>>
  >({});
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      if (!authRedirected.current) {
        authRedirected.current = true;
        router.replace("/");
      }
      return;
    }

    setData(createInitialDashboardViewModel(token));
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;

    let cancelled = false;

    async function loadSectionsSequentially() {
      let merged = { ...EMPTY_DASHBOARD_DATA };
      const authToken = getClientAuthToken();

      for (const section of DASHBOARD_SECTION_ORDER) {
        if (cancelled) return;

        try {
          const payload = await fetchSectionClient(section);
          merged = mergeSectionIntoDashboardData(merged, section, payload);

          if (!cancelled) {
            setData(toViewModel(merged, authToken));
            setLoadingSections((prev) => {
              const next = new Set(prev);
              next.delete(section);
              return next;
            });
            setSectionErrors((prev) => {
              const next = { ...prev };
              delete next[section];
              return next;
            });
          }
        } catch (err) {
          if (!cancelled) {
            const message =
              err instanceof Error
                ? err.message
                : `Failed to load ${SECTION_LABELS[section]}`;

            if (
              message.toLowerCase().includes("session expired") ||
              message.includes("(401)") ||
              message.toLowerCase().includes("not authenticated")
            ) {
              if (!authRedirected.current) {
                authRedirected.current = true;
                router.replace("/");
              }
              return;
            }

            setSectionErrors((prev) => ({
              ...prev,
              [section]: message,
            }));
            setLoadingSections((prev) => {
              const next = new Set(prev);
              next.delete(section);
              return next;
            });
          }
        }

        if (!cancelled) {
          await sleep(SECTION_DELAY_MS);
        }
      }
    }

    loadSectionsSequentially();

    return () => {
      cancelled = true;
    };
  }, [authChecked, router]);

  if (!authChecked || !data) {
    return <DashboardBootScreen message="Checking session..." />;
  }

  return (
    <Dashboard
      data={data}
      loadingSections={loadingSections}
      sectionErrors={sectionErrors}
    />
  );
}
