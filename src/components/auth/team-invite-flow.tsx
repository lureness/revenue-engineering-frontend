"use client";

import {
  CircleAlert,
  Loader2,
  LogIn,
  MailPlus,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import { isValidPasswordLength } from "@/lib/auth/validation";
import {
  acceptTeamInvite,
  registerFromTeamInvite,
  resolveTeamInvite,
} from "@/lib/team-invites/api";
import type { ResolvedTeamInvite } from "@/lib/team-invites/types";

function getRoleLabel(role: string) {
  return role === "admin" ? "Admin" : "Membro";
}

function buildInvitePath(token: string) {
  return `/accept-team-invite?token=${encodeURIComponent(token)}`;
}

function MissingInviteTokenState() {
  return (
    <Card className="glow-border w-full rounded-[2rem] bg-card shadow-md">
      <CardHeader className="gap-3 px-6 pt-6 md:px-7 md:pt-7">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
          <CircleAlert className="size-5" />
        </div>
        <div className="space-y-3">
          <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
            O link de invite está incompleto
          </CardTitle>
          <CardDescription className="text-sm leading-7">
            Abra novamente o e-mail recebido ou peça um novo invite para o time.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-6 pb-6 md:px-7 md:pb-7 sm:flex-row">
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          render={<Link href="/" />}
        >
          Voltar para a landing
        </Button>
      </CardContent>
    </Card>
  );
}

function InviteSummaryCard({ invite }: { invite: ResolvedTeamInvite }) {
  return (
    <Card className="rounded-[1.5rem] bg-background/85">
      <CardContent className="grid gap-4 pt-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Time
          </p>
          <p className="text-sm font-medium text-foreground">
            {invite.team_name}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {invite.team_slug}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            E-mail convidado
          </p>
          <p className="text-sm font-medium text-foreground">{invite.email}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{getRoleLabel(invite.role)}</Badge>
          <Badge variant="secondary">
            {invite.account_exists ? "Conta existente" : "Nova conta"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function TeamInviteFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, tenant, user, signOut, refreshSession } = useAuth();
  const [invite, setInvite] = useState<ResolvedTeamInvite | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [resolveError, setResolveError] = useState<{
    title: string;
    description?: string;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  const token = searchParams.get("token")?.trim() ?? "";
  const invitePath = useMemo(() => buildInvitePath(token), [token]);
  const loginHref = useMemo(
    () => `/login?redirectTo=${encodeURIComponent(invitePath)}`,
    [invitePath],
  );

  useEffect(() => {
    if (!token) {
      setInvite(null);
      setResolveError(null);
      setIsResolving(false);
      return;
    }

    let cancelled = false;

    setIsResolving(true);
    setResolveError(null);

    void resolveTeamInvite(token)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setInvite(result);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setInvite(null);
        setResolveError(
          formatApiErrorMessage(error, {
            fallbackTitle: "Não foi possível carregar o invite.",
          }),
        );
      })
      .finally(() => {
        if (cancelled) {
          return;
        }

        setIsResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      toast.error("O link de invite está incompleto.");
      return;
    }

    if (!isValidPasswordLength(password)) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("A confirmação de senha não confere.");
      return;
    }

    setIsRegistering(true);

    try {
      await registerFromTeamInvite(token, password);
      await refreshSession();
      toast.success("Conta criada e invite aceito.", {
        description: "Você já pode continuar no workspace.",
      });
      startTransition(() => {
        if (tenant?.slug) {
          router.replace(`/workspace/${tenant.slug}/teams`);
        } else {
          router.replace("/workspace/[slug]/teams");
        }
      });
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível concluir o cadastro pelo invite.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleAcceptInvite() {
    if (!token) {
      return;
    }

    setIsAccepting(true);

    try {
      await acceptTeamInvite(token);
      toast.success("Invite aceito com sucesso.");
      startTransition(() => {
        if (tenant?.slug) {
          router.replace(`/workspace/${tenant.slug}/teams`);
        } else {
          router.replace("/workspace/[slug]/teams");
        }
      });
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível aceitar o invite.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsAccepting(false);
    }
  }

  async function handleSwitchAccount() {
    setIsSwitchingAccount(true);

    try {
      await signOut();
      startTransition(() => {
        router.replace(loginHref);
      });
    } finally {
      setIsSwitchingAccount(false);
    }
  }

  if (!token) {
    return <MissingInviteTokenState />;
  }

  if (isResolving) {
    return (
      <Card className="glow-border w-full rounded-[2rem] bg-card shadow-md">
        <CardHeader className="gap-4 px-6 pt-6 md:px-7 md:pt-7">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-foreground text-background">
            <Loader2 className="size-6 animate-spin" />
          </div>
          <div className="space-y-3">
            <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
              Lendo o invite
            </CardTitle>
            <CardDescription className="text-sm leading-7">
              Estamos validando o token para descobrir se o próximo passo é
              login ou criação de conta.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (resolveError || !invite) {
    return (
      <Card className="glow-border w-full rounded-[2rem] bg-card shadow-md">
        <CardHeader className="gap-4 px-6 pt-6 md:px-7 md:pt-7">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-foreground text-background">
            <CircleAlert className="size-6" />
          </div>
          <div className="space-y-3">
            <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
              {resolveError?.title ?? "Invite indisponível"}
            </CardTitle>
            <CardDescription className="text-sm leading-7">
              {resolveError?.description ??
                "Peça um novo invite para continuar com um link válido."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 px-6 pb-6 md:px-7 md:pb-7 sm:flex-row">
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={<Link href="/" />}
          >
            Voltar para a landing
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isAuthenticatedWithInviteEmail =
    status === "authenticated" &&
    user?.email.toLowerCase() === invite.email.toLowerCase();

  const isAuthenticatedWithAnotherEmail =
    status === "authenticated" &&
    user?.email.toLowerCase() !== invite.email.toLowerCase();

  if (invite.account_exists) {
    return (
      <Card className="glow-border w-full rounded-[2rem] bg-card shadow-md">
        <CardHeader className="gap-3 px-6 pt-6 md:px-7 md:pt-7">
          <Badge variant="secondary" className="w-fit">
            Invite de time
          </Badge>
          <div className="space-y-3">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
              <UserCheck className="size-5" />
            </div>
            <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
              Entrar no time com a conta convidada
            </CardTitle>
            <CardDescription className="text-sm leading-7">
              Esse invite já está ligado a uma conta existente. Entre com o
              mesmo e-mail convidado para aceitar o acesso.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid gap-5 px-6 pb-6 md:px-7 md:pb-7">
          <InviteSummaryCard invite={invite} />

          {status === "loading" ? (
            <div className="flex items-center gap-2 rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Validando sua sessão atual...
            </div>
          ) : null}

          {status === "unauthenticated" ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={loginHref} />}
              >
                <LogIn className="size-4" />
                Entrar para aceitar
              </Button>
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={<Link href="/" />}
              >
                Voltar para a landing
              </Button>
            </div>
          ) : null}

          {isAuthenticatedWithInviteEmail ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                size="lg"
                onClick={() => {
                  void handleAcceptInvite();
                }}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                {isAccepting ? "Aceitando..." : "Aceitar invite"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={
                  <Link
                    href={
                      tenant?.slug
                        ? `/workspace/${tenant.slug}/teams`
                        : "/workspace/[slug]/teams"
                    }
                  />
                }
              >
                Ir para times
              </Button>
            </div>
          ) : null}

          {isAuthenticatedWithAnotherEmail ? (
            <div className="grid gap-4 rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
              <p className="text-sm leading-7 text-muted-foreground">
                Você está autenticado como <strong>{user?.email}</strong>, mas o
                invite foi enviado para <strong>{invite.email}</strong>.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => {
                    void handleSwitchAccount();
                  }}
                  disabled={isSwitchingAccount}
                >
                  {isSwitchingAccount ? "Saindo..." : "Trocar de conta"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  nativeButton={false}
                  render={<Link href="/app" />}
                >
                  Manter sessão atual
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glow-border w-full rounded-[2rem] bg-card shadow-md">
      <CardHeader className="gap-3 px-6 pt-6 md:px-7 md:pt-7">
        <Badge variant="secondary" className="w-fit">
          Invite de time
        </Badge>
        <div className="space-y-3">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
            <UserPlus className="size-5" />
          </div>
          <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
            Criar conta a partir do invite
          </CardTitle>
          <CardDescription className="text-sm leading-7">
            Defina uma senha para finalizar a criação da conta e entrar direto
            no time.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 px-6 pb-6 md:px-7 md:pb-7">
        <InviteSummaryCard invite={invite} />

        {status === "authenticated" ? (
          <div className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-4 text-sm leading-7 text-muted-foreground">
            Ao concluir esse cadastro, a sessão atual será substituída pela nova
            conta criada a partir do invite.
          </div>
        ) : null}

        <form className="grid gap-5" onSubmit={handleRegister}>
          <Field>
            <FieldLabel htmlFor="team-invite-password">Senha</FieldLabel>
            <FieldContent>
              <Input
                id="team-invite-password"
                type="password"
                autoComplete="new-password"
                placeholder="Crie uma senha"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="team-invite-password-confirm">
              Confirmar senha
            </FieldLabel>
            <FieldContent>
              <Input
                id="team-invite-password-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.currentTarget.value)
                }
              />
              <FieldDescription>
                A senha precisa ter pelo menos 8 caracteres.
              </FieldDescription>
            </FieldContent>
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg" disabled={isRegistering}>
              {isRegistering ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MailPlus className="size-4" />
              )}
              {isRegistering ? "Criando..." : "Criar conta e entrar"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/" />}
            >
              Voltar para a landing
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
