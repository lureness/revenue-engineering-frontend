"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { ApiClientError } from "@/lib/api/client";
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import {
  AUTH_UNAUTHORIZED_EVENT,
  type AuthUnauthorizedEventDetail,
} from "@/lib/auth/events";

export const UNAUTHORIZED_SESSION_TOAST_ID = "workspace-unauthorized-session";

export function UnauthorizedSessionToastListener() {
  const pathname = usePathname();
  const { status } = useAuth();
  const hasShownToastRef = useRef(false);

  useEffect(() => {
    if (status === "authenticated") {
      hasShownToastRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    function handleUnauthorized(event: Event) {
      if (status !== "authenticated" || !pathname.startsWith("/workspace")) {
        return;
      }

      if (hasShownToastRef.current) {
        return;
      }

      const detail = (
        event as CustomEvent<AuthUnauthorizedEventDetail | undefined>
      ).detail;

      const presentation = formatApiErrorMessage(
        new ApiClientError({
          status: detail?.status ?? 401,
          message: detail?.message ?? "missing bearer token",
          requestId: detail?.requestId ?? null,
          detail,
        }),
      );

      hasShownToastRef.current = true;
      toast.warning(presentation.title, {
        id: UNAUTHORIZED_SESSION_TOAST_ID,
        description: presentation.description,
      });
    }

    window.addEventListener(
      AUTH_UNAUTHORIZED_EVENT,
      handleUnauthorized as EventListener,
    );

    return () => {
      window.removeEventListener(
        AUTH_UNAUTHORIZED_EVENT,
        handleUnauthorized as EventListener,
      );
    };
  }, [pathname, status]);

  return null;
}
