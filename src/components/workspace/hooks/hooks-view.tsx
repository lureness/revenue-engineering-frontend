"use client";

import {
  FileText,
  Link2,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Trash2,
  Zap,
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

type MarketingHook = {
  id: string;
  name: string;
  url: string;
  event: string;
  is_active: boolean;
  created_at: string;
};

type CreateHookPayload = {
  name: string;
  url: string;
  event: string;
};

async function getHooks(): Promise<MarketingHook[]> {
  const response = await fetch("/api/hooks");
  if (!response.ok) throw new Error("Failed to fetch hooks");
  return response.json();
}

async function createHook(payload: CreateHookPayload): Promise<MarketingHook> {
  const response = await fetch("/api/hooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create hook");
  return response.json();
}

async function toggleHook(hookId: string, isActive: boolean): Promise<void> {
  const response = await fetch(`/api/hooks/${hookId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: !isActive }),
  });
  if (!response.ok) throw new Error("Failed to update hook");
}

async function deleteHook(hookId: string): Promise<void> {
  const response = await fetch(`/api/hooks/${hookId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete hook");
}

const hookTypes = [
  { value: "ebook", label: "E-book" },
  { value: "worksheet", label: "Planilha" },
  { value: "checklist", label: "Checklist" },
  { value: "guide", label: "Guia" },
  { value: "template", label: "Template" },
  { value: "tool", label: "Ferramenta" },
];

function CreateHookDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [event, setEvent] = useState("ebook");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createHook({ name, url, event });
      toast.success("Isca criada com sucesso.");
      setName("");
      setUrl("");
      setEvent("ebook");
      setOpen(false);
      onCreated?.();
    } catch {
      toast.error("Erro ao criar isca.");
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
            Nova isca
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nova isca digital</DialogTitle>
            <DialogDescription>
              Cadastre um material para campanhas, landing pages e fluxos de
              captação.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="hook-name">Nome</Label>
              <Input
                id="hook-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Checklist de diagnóstico comercial"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hook-url">Link do material</Label>
              <Input
                id="hook-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://seu-dominio.com/material/checklist-diagnostico"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hook-event">Tipo de material</Label>
              <select
                id="hook-event"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {hookTypes.map((et) => (
                  <option key={et.value} value={et.value}>
                    {et.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar isca"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HookCard({
  hook,
  onUpdated,
  onDeleted,
}: {
  hook: MarketingHook;
  onUpdated?: () => void;
  onDeleted?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await toggleHook(hook.id, hook.is_active);
      onUpdated?.();
      toast.success(hook.is_active ? "Isca desativada." : "Isca ativada.");
    } catch {
      toast.error("Erro ao atualizar isca.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Excluir isca "${hook.name}"?`)) return;
    setIsLoading(true);
    try {
      await deleteHook(hook.id);
      onDeleted?.();
      toast.success("Isca excluída.");
    } catch {
      toast.error("Erro ao excluir isca.");
    } finally {
      setIsLoading(false);
    }
  };

  const eventLabel =
    hookTypes.find((et) => et.value === hook.event)?.label ?? hook.event;

  return (
    <Card className="bg-card/85 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-foreground/10">
              <FileText className="size-5 text-foreground/60" />
            </div>
            <div>
              <CardTitle className="text-base">{hook.name}</CardTitle>
              <CardDescription className="text-xs">
                {eventLabel}
              </CardDescription>
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
              <DropdownMenuItem onClick={handleToggle} disabled={isLoading}>
                <Zap className="size-4" />
                {hook.is_active ? "Desativar" : "Ativar"}
              </DropdownMenuItem>
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
          <Badge variant={hook.is_active ? "default" : "secondary"}>
            {hook.is_active ? "Disponível" : "Oculta"}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link2 className="size-3" />
            <span className="max-w-[200px] truncate">{hook.url}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketingHooksView() {
  const [hooks, setHooks] = useState<MarketingHook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getHooks();
      setHooks(Array.isArray(data) ? data : []);
    } catch {
      setHooks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadHooks();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadHooks();
  }, [loadHooks]);

  const hooksByStatus = {
    active: hooks.filter((h) => h.is_active).length,
    inactive: hooks.filter((h) => !h.is_active).length,
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
            {hooks.length === 0
              ? "Nenhuma isca"
              : `${hooks.length} isca${hooks.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <CreateHookDialog onCreated={loadHooks} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="grid gap-3 pt-5">
            <Badge variant="secondary">Total</Badge>
            <p className="font-serif text-3xl tracking-tight text-foreground">
              {hooks.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="grid gap-3 pt-5">
            <Badge variant="default">Disponíveis</Badge>
            <p className="font-serif text-3xl tracking-tight text-green-600">
              {hooksByStatus.active}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="grid gap-3 pt-5">
            <Badge variant="outline">Ocultas</Badge>
            <p className="font-serif text-3xl tracking-tight text-muted-foreground">
              {hooksByStatus.inactive}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Iscas digitais cadastradas</h2>
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

        {hooks.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText className="size-4" />
              </EmptyMedia>
              <EmptyTitle>Nenhuma isca cadastrada</EmptyTitle>
              <EmptyDescription>
                Cadastre ebooks, planilhas, guias e outros materiais para usar
                em campanhas e atrair novos leads.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {hooks.map((hook) => (
              <HookCard
                key={hook.id}
                hook={hook}
                onUpdated={loadHooks}
                onDeleted={loadHooks}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
