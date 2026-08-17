"use client";

import { AUTH_CHANGED_EVENT, getStoredToken } from "@/lib/auth";
import { useCallback, useEffect } from "react";

/** Redirects to dashboard when a token exists — listens for login after mount. */
export default function AuthRedirect() {
  const redirectIfAuthed = useCallback(() => {
    if (getStoredToken()) {
      window.location.assign("/dashboard");
    }
  }, []);

  useEffect(() => {
    redirectIfAuthed();

    window.addEventListener(AUTH_CHANGED_EVENT, redirectIfAuthed);
    window.addEventListener("storage", redirectIfAuthed);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, redirectIfAuthed);
      window.removeEventListener("storage", redirectIfAuthed);
    };
  }, [redirectIfAuthed]);

  return null;
}
