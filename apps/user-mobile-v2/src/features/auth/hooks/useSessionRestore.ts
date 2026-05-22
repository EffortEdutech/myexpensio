import { useEffect } from "react";

import { loadAuthSession } from "@/features/auth/sessionStorage";
import { useAuthStore } from "@/state/authStore";

export function useSessionRestore() {
  const setSession = useAuthStore((state) => state.setSession);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    let isMounted = true;

    loadAuthSession()
      .then((session) => {
        if (isMounted) {
          setSession(session);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSession(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [setSession]);

  return status;
}
