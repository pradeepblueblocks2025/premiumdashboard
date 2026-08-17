import { Suspense } from "react";
import LoginTokenClient from "../LoginTokenClient";

export default function LoginCatchAllPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-sm text-slate-400">Signing you in...</p>
        </div>
      }
    >
      <LoginTokenClient />
    </Suspense>
  );
}
