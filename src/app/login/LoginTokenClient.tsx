"use client";

import { setStoredToken } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function tokenFromPath(tokenParam: string | string[] | undefined): string | undefined {
  if (!tokenParam) return undefined;
  if (Array.isArray(tokenParam)) {
    return tokenParam.join(".");
  }
  return tokenParam;
}

export default function LoginTokenClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pathToken = tokenFromPath(params.token as string | string[] | undefined);
    const queryToken = searchParams.get("token");
    const rawToken = pathToken ?? queryToken;

    if (!rawToken) {
      setError("No token provided in the URL.");
      return;
    }

    try {
      setStoredToken(decodeURIComponent(rawToken));
      window.location.assign("/dashboard");
    } catch {
      setError("Could not save the login token.");
    }
  }, [params.token, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      <p className="text-sm text-slate-400">Signing you in...</p>
    </div>
  );
}
