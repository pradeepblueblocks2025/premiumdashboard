"use client";

import type { DashboardViewModel, FirstLevelCustomer } from "@/lib/types";
import {
  fetchBackendJson,
  fetchFirstLevelCustomers,
  getClientAuthToken,
} from "@/lib/clientApi";
import { getStoredToken } from "@/lib/auth";
import { fetchCustomerAccess } from "@/lib/customerAccess";
import { withCustomerId } from "@/lib/format";
import ComingSoon from "@/components/ComingSoon";
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
  section: DashboardSectionId,
  customerId?: string | null
): Promise<Record<string, unknown>> {
  return fetchBackendJson<Record<string, unknown>>(
    withCustomerId(SECTION_BACKEND_PATH[section], customerId)
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAuthError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("session expired") ||
    message.includes("(401)") ||
    lower.includes("not authenticated")
  );
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
  const [accessGate, setAccessGate] = useState<"pending" | "allowed" | "blocked">(
    "pending"
  );
  const [accessCheckId, setAccessCheckId] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [firstLevelCustomers, setFirstLevelCustomers] = useState<
    FirstLevelCustomer[]
  >([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);

  const viewingCustomer =
    firstLevelCustomers.find((c) => c.customerId === selectedCustomerId) ??
    null;

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      if (!authRedirected.current) {
        authRedirected.current = true;
        router.replace("/");
      }
      return;
    }

    const authToken = token;
    let cancelled = false;
    setAccessGate("pending");
    setAuthChecked(false);

    async function checkDashboardAccess() {
      try {
        const access = await fetchCustomerAccess();
        if (cancelled) return;
        if (access.allowed) {
          setData(createInitialDashboardViewModel(authToken));
          setAccessGate("allowed");
          setAuthChecked(true);
          return;
        }
        setData(null);
        setAccessGate("blocked");
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to verify dashboard access";
        if (isAuthError(message)) {
          if (!authRedirected.current) {
            authRedirected.current = true;
            router.replace("/");
          }
          return;
        }
        setData(null);
        setAccessGate("blocked");
      }
    }

    checkDashboardAccess();

    return () => {
      cancelled = true;
    };
  }, [router, accessCheckId]);

  useEffect(() => {
    if (!authChecked) return;

    let cancelled = false;

    async function loadCustomers() {
      setCustomersLoading(true);
      setCustomersError(null);
      try {
        const customers = await fetchFirstLevelCustomers();
        if (!cancelled) {
          setFirstLevelCustomers(customers);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to load first-level customers";
          if (isAuthError(message)) {
            if (!authRedirected.current) {
              authRedirected.current = true;
              router.replace("/");
            }
            return;
          }
          setCustomersError(message);
        }
      } finally {
        if (!cancelled) setCustomersLoading(false);
      }
    }

    loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [authChecked, router]);

  useEffect(() => {
    if (!authChecked) return;

    let cancelled = false;
    const token = getClientAuthToken();

    setData(createInitialDashboardViewModel(token, viewingCustomer));
    setLoadingSections(new Set(DASHBOARD_SECTION_ORDER));
    setSectionErrors({});

    async function loadSectionsSequentially() {
      let merged = { ...EMPTY_DASHBOARD_DATA };
      const authToken = getClientAuthToken();

      for (const section of DASHBOARD_SECTION_ORDER) {
        if (cancelled) return;

        try {
          const payload = await fetchSectionClient(section, selectedCustomerId);
          merged = mergeSectionIntoDashboardData(merged, section, payload);

          if (!cancelled) {
            setData(toViewModel(merged, authToken, viewingCustomer));
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

            if (isAuthError(message)) {
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
  }, [authChecked, router, selectedCustomerId]);

  if (accessGate === "pending") {
    return <DashboardBootScreen message="Checking dashboard access..." />;
  }

  if (accessGate === "blocked") {
    return (
      <ComingSoon onRetry={() => setAccessCheckId((current) => current + 1)} />
    );
  }

  if (!authChecked || !data) {
    return <DashboardBootScreen message="Checking session..." />;
  }

  return (
    <Dashboard
      data={data}
      loadingSections={loadingSections}
      sectionErrors={sectionErrors}
      firstLevelCustomers={firstLevelCustomers}
      selectedCustomerId={selectedCustomerId}
      customersLoading={customersLoading}
      customersError={customersError}
      onSelectCustomer={setSelectedCustomerId}
    />
  );
}
