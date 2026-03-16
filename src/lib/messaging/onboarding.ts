export function shouldRedirectToProviderSetup(pathname: string) {
  if (!pathname.startsWith("/app")) {
    return false;
  }

  if (pathname.startsWith("/app/messaging")) {
    return false;
  }

  if (pathname.startsWith("/app/contacts")) {
    return false;
  }

  if (pathname === "/app/user") {
    return false;
  }

  return true;
}
