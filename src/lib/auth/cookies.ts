export const ACCESS_TOKEN_COOKIE_NAME = "lureness.access-token";
export const REFRESH_TOKEN_COOKIE_NAME = "lureness.refresh-token";

export type AuthCookiePayload = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
};

type CookieStore = {
  set: (
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      maxAge: number;
      path: string;
      sameSite: "lax";
      secure: boolean;
    },
  ) => void;
  delete: (name: string) => void;
};

type CookieOptions = {
  secure: boolean;
};

function getCookieOptions(maxAge: number, options: CookieOptions) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: options.secure,
  };
}

export function writeAuthCookies(
  cookieStore: CookieStore,
  payload: AuthCookiePayload,
  options: CookieOptions,
) {
  cookieStore.set(
    ACCESS_TOKEN_COOKIE_NAME,
    payload.access_token,
    getCookieOptions(payload.expires_in, options),
  );
  cookieStore.set(
    REFRESH_TOKEN_COOKIE_NAME,
    payload.refresh_token,
    getCookieOptions(payload.refresh_expires_in, options),
  );
}

export function clearAuthCookies(cookieStore: CookieStore) {
  cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME);
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
}
