export function shouldRedirectToProviderSetup(pathname: string) {
  if (!pathname.startsWith("/workspace/")) {
    return false;
  }

  const allowedWithoutProviderSetup = [
    "/inbox/messages",
    "/inbox/contacts",
    "/inbox/agents",
    "/surveys",
    "/settings/account",
  ];

  if (
    allowedWithoutProviderSetup.some((allowedPath) =>
      pathname.includes(allowedPath),
    )
  ) {
    return false;
  }

  return true;
}
