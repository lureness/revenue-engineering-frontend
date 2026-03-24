"use client";

import {
  Activity,
  Bot,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AgentItem = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "inactive" | "paused";
  model: string;
  prompt_template: string | null;
  created_at: string;
};

type CreateAgentPayload = {
  name: string;
  description?: string;
  model: string;
  prompt_template?: string;
};

async function getAgents(): Promise<AgentItem[]> {
  const response = await fetch("/api/inbox/agents");
  if (!response.ok) throw new Error("Failed to fetch agents");
  return response.json();
}

async function createAgent(payload: CreateAgentPayload): Promise<AgentItem> {
  const response = await fetch("/api/inbox/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create agent");
  return response.json();
}

async function updateAgentStatus(
  agentId: string,
  status: string,
): Promise<void> {
  const response = await fetch(`/api/inbox/agents/${agentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update agent");
}

async function deleteAgent(agentId: string): Promise<void> {
  const response = await fetch(`/api/inbox/agents/${agentId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete agent");
}

function CreateAgentDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createAgent({
        name,
        description: description || undefined,
        model,
      });
      toast.success("Agent criado com sucesso.");
      setName("");
      setDescription("");
      setModel("gpt-4o-mini");
      setOpen(false);
      onCreated?.();
    } catch {
      toast.error("Erro ao criar agent. Verifique os dados.");
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo agent</DialogTitle>
            <DialogDescription>
              Crie um agent de IA para automatizar conversas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="agent-name">Nome</Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do agent"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agent-description">Descrição</Label>
              <Input
                id="agent-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do agent"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agent-model">Modelo</Label>
              <Input
                id="agent-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o-mini"
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
  onDeleted,
}: {
  agent: AgentItem;
  onUpdated?: () => void;
  onDeleted?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (status: string) => {
    setIsLoading(true);
    try {
      await updateAgentStatus(agent.id, status);
      onUpdated?.();
      toast.success(
        `Agent ${status === "active" ? "ativado" : status === "paused" ? "pausado" : "desativado"}.`,
      );
    } catch {
      toast.error("Erro ao atualizar status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Excluir agent "${agent.name}"?`)) return;
    setIsLoading(true);
    try {
      await deleteAgent(agent.id);
      onDeleted?.();
      toast.success("Agent excluído.");
    } catch {
      toast.error("Erro ao excluir agent.");
    } finally {
      setIsLoading(false);
    }
  };

  const statusConfig = {
    active: { label: "Ativo", color: "bg-green-500/10 text-green-600" },
    inactive: { label: "Inativo", color: "bg-muted text-muted-foreground" },
    paused: { label: "Pausado", color: "bg-amber-500/10 text-amber-600" },
  };

  const status =
    statusConfig[agent.status as keyof typeof statusConfig] ??
    statusConfig.inactive;

  return (
    <Card className="bg-card/85 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-foreground/10">
              <Bot className="size-5 text-foreground/60" />
            </div>
            <div>
              <CardTitle className="text-base">{agent.name}</CardTitle>
              {agent.description && (
                <CardDescription className="text-xs">
                  {agent.description}
                </CardDescription>
              )}
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
              {agent.status !== "active" && (
                <DropdownMenuItem
                  onClick={() => void handleStatusChange("active")}
                >
                  <Play className="size-4" />
                  Ativar
                </DropdownMenuItem>
              )}
              {agent.status !== "paused" && agent.status === "active" && (
                <DropdownMenuItem
                  onClick={() => void handleStatusChange("paused")}
                >
                  <Pause className="size-4" />
                  Pausar
                </DropdownMenuItem>
              )}
              {agent.status !== "inactive" && (
                <DropdownMenuItem
                  onClick={() => void handleStatusChange("inactive")}
                >
                  <Activity className="size-4" />
                  Desativar
                </DropdownMenuItem>
              )}
              <Separator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isLoading}
                onClick={handleDelete}
              >
                <Trash2 className="size-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={cn("text-[10px]", status.color)}
          >
            {status.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{agent.model}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function AgentsView() {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAgents();
      setAgents(Array.isArray(data) ? data : []);
    } catch {
      setAgents([]);
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
    active: agents.filter((a) => a.status === "active").length,
    paused: agents.filter((a) => a.status === "paused").length,
    inactive: agents.filter((a) => a.status === "inactive").length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card/85 shadow-sm">
              <CardContent className="grid gap-3 pt-5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <Badge variant="outline">Pausados</Badge>
            <p className="font-serif text-3xl tracking-tight text-amber-600">
              {agentsByStatus.paused}
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
                Crie seu primeiro agent de IA para automatizar conversas.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onUpdated={loadAgents}
                onDeleted={loadAgents}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
