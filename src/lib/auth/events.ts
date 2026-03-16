export const AUTH_UNAUTHORIZED_EVENT = "lureness:auth-unauthorized";

export function dispatchAuthUnauthorizedEvent() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
}
