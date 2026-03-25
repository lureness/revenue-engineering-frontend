export function shouldRedirectToProviderSetup(pathname: string) {
  if (!pathname.startsWith("/workspace/")) {
    return false;
  }

  if (
    pathname.startsWith("/workspace/") &&
    pathname.includes("/inbox/messages")
  ) {
    return false;
  }

  if (
    pathname.startsWith("/workspace/") &&
    pathname.includes("/inbox/contacts")
  ) {
    return false;
  }

  if (pathname.startsWith("/workspace/") && pathname.includes("/surveys")) {
    return false;
  }

  if (
    pathname.startsWith("/workspace/") &&
    pathname.includes("/settings/account")
  ) {
    return false;
  }

  return true;
}
