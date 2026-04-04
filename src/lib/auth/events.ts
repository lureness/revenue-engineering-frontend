export const AUTH_UNAUTHORIZED_EVENT = "lureness:auth-unauthorized";

export type AuthUnauthorizedEventDetail = {
  status: number;
  message: string;
  requestId: string | null;
  path: string;
};

export function dispatchAuthUnauthorizedEvent(
  detail?: AuthUnauthorizedEventDetail,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT, { detail }));
}
