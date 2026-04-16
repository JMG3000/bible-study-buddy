"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  AUTH_SESSION_EXPIRED_MESSAGE,
  IDLE_SESSION_STORAGE_KEY,
  IDLE_SESSION_TIMEOUT_MS,
} from "@/lib/urls";

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "pointerdown",
  "keydown",
  "focus",
  "scroll",
];

export function SessionTimeout() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let timeoutId: number | undefined;
    let isSignedIn = false;

    const scheduleExpiryCheck = (lastActivityAt: number) => {
      window.clearTimeout(timeoutId);
      const remaining = IDLE_SESSION_TIMEOUT_MS - (Date.now() - lastActivityAt);
      timeoutId = window.setTimeout(
        expireSession,
        Math.max(1_000, remaining),
      );
    };

    const markActivity = () => {
      if (!isSignedIn) {
        return;
      }

      const now = Date.now();
      window.localStorage.setItem(IDLE_SESSION_STORAGE_KEY, now.toString());
      scheduleExpiryCheck(now);
    };

    const expireSession = async () => {
      if (!isSignedIn) {
        return;
      }

      window.localStorage.removeItem(IDLE_SESSION_STORAGE_KEY);
      await supabase.auth.signOut({ scope: "local" });
      window.location.assign(
        `/login?error=${encodeURIComponent(AUTH_SESSION_EXPIRED_MESSAGE)}`,
      );
    };

    const syncActivityFromStorage = () => {
      const storedValue = window.localStorage.getItem(IDLE_SESSION_STORAGE_KEY);
      const lastActivityAt = Number.parseInt(storedValue ?? "", 10);

      if (!Number.isFinite(lastActivityAt)) {
        markActivity();
        return;
      }

      if (Date.now() - lastActivityAt >= IDLE_SESSION_TIMEOUT_MS) {
        void expireSession();
        return;
      }

      scheduleExpiryCheck(lastActivityAt);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncActivityFromStorage();
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        isSignedIn = true;
        markActivity();
      }

      if (event === "SIGNED_OUT") {
        isSignedIn = false;
        window.localStorage.removeItem(IDLE_SESSION_STORAGE_KEY);
        window.clearTimeout(timeoutId);
      }
    });

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, markActivity, { passive: true });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    void supabase.auth.getSession().then(({ data }) => {
      isSignedIn = Boolean(data.session);

      if (isSignedIn) {
        syncActivityFromStorage();
        return;
      }

      window.localStorage.removeItem(IDLE_SESSION_STORAGE_KEY);
    });

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, markActivity);
      }
    };
  }, []);

  return null;
}
