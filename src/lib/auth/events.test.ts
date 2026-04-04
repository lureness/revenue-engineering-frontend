import {
  AUTH_UNAUTHORIZED_EVENT,
  type AuthUnauthorizedEventDetail,
  dispatchAuthUnauthorizedEvent,
} from "@/lib/auth/events";

describe("auth events", () => {
  it("dispatches the global unauthorized event in the browser", () => {
    const detail: AuthUnauthorizedEventDetail = {
      status: 401,
      message: "missing bearer token",
      requestId: "req_123",
      path: "/landing-pages",
    };

    let receivedDetail: AuthUnauthorizedEventDetail | undefined;
    const listener = vi.fn((event: Event) => {
      receivedDetail = (
        event as CustomEvent<AuthUnauthorizedEventDetail | undefined>
      ).detail;
    });
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, listener);

    dispatchAuthUnauthorizedEvent(detail);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(receivedDetail).toEqual(detail);

    window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, listener);
  });
});
