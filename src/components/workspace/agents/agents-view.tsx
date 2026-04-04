"use client";

import { Activity, Bot, MoreHorizontal, Plus, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api/client";
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import { cn } from "@/lib/utils";

type AgentItem = {
  id: string;
  code: string;
  name: string;
  role_title: string | null;
  description: string;
  system_prompt: string;
  opening_message_template: string;
  is_active: boolean;
  latest_run?: {
    id: string;
    analysis_type: string;
    status: string;
    summary: string | null;
    next_action: string | null;
    suggested_reply: string | null;
    created_at: string;
  } | null;
  created_at: string;
  updated_at: string;
};

type CreateAgentPayload = {
  code: string;
  name: string;
  role_title?: string;
  description?: string;
  system_prompt?: string;
  opening_message_template: string;
  is_active?: boolean;
};

function slugifyAgentCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

async function getAgents(): Promise<AgentItem[]> {
  return apiRequest<AgentItem[]>("/inbox/agents");
}

async function createAgent(payload: CreateAgentPayload): Promise<AgentItem> {
  return apiRequest<AgentItem>("/inbox/agents", {
    method: "POST",
    body: payload,
  });
}

async function updateAgent(
  agentId: string,
  payload: Partial<CreateAgentPayload>,
): Promise<AgentItem> {
  return apiRequest<AgentItem>(`/inbox/agents/${agentId}`, {
    method: "PATCH",
    body: payload,
  });
}

function CreateAgentDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [roleTitle, setRoleTitle] = useState("Especialista");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [openingMessageTemplate, setOpeningMessageTemplate] = useState(
    "Olá{% if contact.first_name %} {{ contact.first_name }}{% endif %}! Aqui é {{ agent.name }} da {{ workspace.name }}.",
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    setCode((currentCode) =>
      currentCode === "" || currentCode === slugifyAgentCode(name)
        ? slugifyAgentCode(value)
        : currentCode,
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await createAgent({
        code: slugifyAgentCode(code || name),
        name,
        role_title: roleTitle || undefined,
        description,
        system_prompt: systemPrompt,
        opening_message_template: openingMessageTemplate,
        is_active: true,
      });
      toast.success("Agent criado com sucesso.");
      setName("");
      setCode("");
      setRoleTitle("Especialista");
      setDescription("");
      setSystemPrompt("");
      setOpeningMessageTemplate(
        "Olá{% if contact.first_name %} {{ contact.first_name }}{% endif %}! Aqui é {{ agent.name }} da {{ workspace.name }}.",
      );
      setOpen(false);
      onCreated?.();
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Erro ao criar agent.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Novo agent
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo agent</DialogTitle>
            <DialogDescription>
              Cadastre o especialista que vai gerar análise e drafts de resposta
              para o inbox e os fluxos pós-survey do workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="agent-name">Nome</Label>
                <Input
                  id="agent-name"
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="Especialista de Diagnóstico"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="agent-code">Código</Label>
                <Input
                  id="agent-code"
                  value={code}
                  onChange={(event) =>
                    setCode(slugifyAgentCode(event.target.value))
                  }
                  placeholder="especialista-diagnostico"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agent-role-title">Cargo ou papel</Label>
              <Input
                id="agent-role-title"
                value={roleTitle}
                onChange={(event) => setRoleTitle(event.target.value)}
                placeholder="Especialista em Receita"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agent-description">Descrição</Label>
              <Textarea
                id="agent-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Explique quando esse agent deve atuar e qual contexto ele cobre."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agent-system-prompt">System prompt</Label>
              <Textarea
                id="agent-system-prompt"
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                placeholder="Instruções internas de atuação do agent."
                rows={5}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agent-opening-message">
                Mensagem inicial do agent
              </Label>
              <Textarea
                id="agent-opening-message"
                value={openingMessageTemplate}
                onChange={(event) =>
                  setOpeningMessageTemplate(event.target.value)
                }
                placeholder="Mensagem-base usada como referência para drafts e follow-ups sugeridos."
                rows={5}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar agent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AgentCard({
  agent,
  onUpdated,
}: {
  agent: AgentItem;
  onUpdated?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleActivationToggle = async (nextIsActive: boolean) => {
    setIsLoading(true);

    try {
      await updateAgent(agent.id, { is_active: nextIsActive });
      onUpdated?.();
      toast.success(
        nextIsActive ? "Agent ativado com sucesso." : "Agent desativado.",
      );
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Erro ao atualizar agent.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card/85 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-foreground/10">
              <Bot className="size-5 text-foreground/60" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">{agent.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{agent.code}</span>
                {agent.role_title ? <span>• {agent.role_title}</span> : null}
              </div>
              {agent.description ? (
                <CardDescription className="text-xs">
                  {agent.description}
                </CardDescription>
              ) : null}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={isLoading}
                onClick={() => void handleActivationToggle(!agent.is_active)}
              >
                <Activity className="size-4" />
                {agent.is_active ? "Desativar" : "Ativar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px]",
              agent.is_active
                ? "bg-green-500/10 text-green-600"
                : "bg-muted text-muted-foreground",
            )}
          >
            {agent.is_active ? "Ativo" : "Inativo"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Atualizado em{" "}
            {new Date(agent.updated_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Base de resposta
          </p>
          <p className="line-clamp-3 text-sm text-foreground/80">
            {agent.opening_message_template}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Último run
          </p>
          <p className="text-sm text-foreground/80">
            {agent.latest_run?.summary ||
              "Sem análises executadas ainda para este especialista."}
          </p>
          {agent.latest_run?.next_action ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Próxima ação: {agent.latest_run.next_action}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function AgentsView() {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAgents();
      setAgents(Array.isArray(data) ? data : []);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível carregar os agents do workspace.",
      });
      setAgents([]);
      setError(presentation.title);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAgents();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  const agentsByStatus = {
    active: agents.filter((agent) => agent.is_active).length,
    inactive: agents.filter((agent) => !agent.is_active).length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="bg-card/85 shadow-sm">
              <CardContent className="grid gap-3 pt-5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {agents.length === 0
              ? "Nenhum agent"
              : `${agents.length} agent${agents.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <CreateAgentDialog onCreated={loadAgents} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="grid gap-3 pt-5">
            <Badge variant="secondary">Total</Badge>
            <p className="font-serif text-3xl tracking-tight text-foreground">
              {agents.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="grid gap-3 pt-5">
            <Badge variant="outline">Ativos</Badge>
            <p className="font-serif text-3xl tracking-tight text-green-600">
              {agentsByStatus.active}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="grid gap-3 pt-5">
            <Badge variant="outline">Inativos</Badge>
            <p className="font-serif text-3xl tracking-tight text-muted-foreground">
              {agentsByStatus.inactive}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Agents configurados</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
          >
            <RefreshCcw
              className={cn("size-4", isRefreshing && "animate-spin")}
            />
          </Button>
        </div>

        {agents.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Bot className="size-4" />
              </EmptyMedia>
              <EmptyTitle>Nenhum agent configurado</EmptyTitle>
              <EmptyDescription>
                Crie o primeiro especialista do workspace para gerar análise e
                drafts de resposta nas conversas do inbox.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} onUpdated={loadAgents} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
