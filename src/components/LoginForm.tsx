"use client";

import { loginWithCredentials } from "@/lib/loginApi";
import { FormEvent, useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginWithCredentials(email.trim(), password);
      // Full page load avoids Next.js soft-nav hanging on a large dashboard bundle.
      window.location.assign("/dashboard");
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card p-6 space-y-4 border border-[#1a2240]"
    >
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-medium text-slate-400 mb-1.5"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-[#131a35] border border-[#2a3458] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-medium text-slate-400 mb-1.5"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-[#131a35] border border-[#2a3458] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "Redirecting to dashboard..." : "Sign In"}
      </button>
    </form>
  );
}
