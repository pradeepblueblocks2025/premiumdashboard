"use client";

import BrandLogo from "@/components/BrandLogo";
import { clearStoredToken } from "@/lib/auth";
import { Construction, LogOut, Rocket, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

type ComingSoonProps = {
  onRetry?: () => void;
};

export default function ComingSoon({ onRetry }: ComingSoonProps) {
  const router = useRouter();

  function handleLogout() {
    clearStoredToken();
    router.replace("/");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b1a] grid-bg">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/3 left-0 h-56 w-56 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <BrandLogo size={32} priority />
          <span className="font-bold text-white tracking-wide text-sm truncate">
            FORTUNE NFT
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-9 h-9 rounded-full bg-[#131a35] border border-[#1a2240] flex items-center justify-center hover:bg-[#1a2240] transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
        </button>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 pb-12">
        <div className="w-full max-w-lg text-center">
          <div className="relative mx-auto mb-8 h-28 w-28">
            <div className="absolute inset-0 rounded-full border border-violet-500/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border border-cyan-400/20" />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#0d1228] border border-[#2a3458] shadow-[0_0_40px_rgba(139,92,246,0.25)]">
              <Construction className="h-10 w-10 text-violet-300" />
            </div>
            <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#131a35] border border-cyan-400/40">
              <Rocket className="h-3.5 w-3.5 text-cyan-300" />
            </span>
          </div>

          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-violet-300">
            <Sparkles className="h-3 w-3" />
            Under Construction
          </p>

          <h1 className="soon-shimmer text-3xl sm:text-4xl font-bold tracking-tight">
            Launching Soon
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed max-w-md mx-auto">
            Your professional dashboard is being prepared. We&apos;re putting
            the finishing touches in place and will open access shortly.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Check access again
              </button>
            )}
            <a
              href="https://fortunenft.world/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-[#2a3458] bg-[#131a35] text-sm font-medium text-slate-300 hover:border-violet-500/40 hover:text-white transition-colors"
            >
              Visit Fortune NFT
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
