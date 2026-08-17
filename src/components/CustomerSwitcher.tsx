"use client";

import type { FirstLevelCustomer } from "@/lib/types";
import { ChevronDown, Loader2, Search, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type CustomerSwitcherProps = {
  customers: FirstLevelCustomer[];
  selectedCustomerId: string | null;
  loading?: boolean;
  error?: string | null;
  onSelect: (customerId: string | null) => void;
};

export default function CustomerSwitcher({
  customers,
  selectedCustomerId,
  loading = false,
  error = null,
  onSelect,
}: CustomerSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = customers.find((c) => c.customerId === selectedCustomerId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) => {
      const haystack = `${customer.name} ${customer.email ?? ""} ${customer.rank ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [customers, query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function choose(customerId: string | null) {
    onSelect(customerId);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="h-9 max-w-[11.5rem] sm:max-w-[16rem] px-2.5 rounded-lg bg-[#131a35] border border-[#1a2240] flex items-center gap-2 hover:bg-[#1a2240] transition-colors"
        title="View a first-level customer's dashboard"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Users className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
        <span className="min-w-0 flex-1 text-left text-[11px] text-slate-200 truncate">
          {selected ? selected.name : "My dashboard"}
        </span>
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin flex-shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-xl bg-[#0d1228] border border-[#1a2240] shadow-xl shadow-black/40 z-50 overflow-hidden">
          <div className="p-2 border-b border-[#1a2240]">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#131a35] border border-[#2a3458]">
              <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search L1 customers"
                className="w-full bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => choose(null)}
              className={`w-full px-3 py-2 text-left text-xs hover:bg-violet-500/10 ${
                !selectedCustomerId ? "text-violet-300" : "text-slate-300"
              }`}
            >
              My dashboard
            </button>
            {error ? (
              <p className="px-3 py-2 text-[11px] text-red-400">{error}</p>
            ) : loading && customers.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-slate-500">Loading customers...</p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-slate-500">
                No first-level customers found
              </p>
            ) : (
              filtered.map((customer) => (
                <button
                  type="button"
                  key={customer.customerId}
                  onClick={() => choose(customer.customerId)}
                  className={`w-full px-3 py-2 text-left hover:bg-violet-500/10 ${
                    selectedCustomerId === customer.customerId
                      ? "bg-violet-500/10"
                      : ""
                  }`}
                >
                  <span className="block text-xs text-slate-200 truncate">
                    {customer.name}
                  </span>
                  <span className="block text-[10px] text-slate-500 truncate">
                    {[customer.rank, customer.email].filter(Boolean).join(" · ") ||
                      customer.customerId}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
