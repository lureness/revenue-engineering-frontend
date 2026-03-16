import {
  AUTH_UNAUTHORIZED_EVENT,
  dispatchAuthUnauthorizedEvent,
} from "@/lib/auth/events";

describe("auth events", () => {
  it("dispatches the global unauthorized event in the browser", () => {
    const listener = vi.fn();
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, listener);

    dispatchAuthUnauthorizedEvent();

    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, listener);
  });
});
