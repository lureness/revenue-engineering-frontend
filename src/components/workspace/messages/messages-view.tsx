"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Mail,
  MessageCircle,
  Phone,
  RefreshCcw,
  Smartphone,
  X,
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/lib/messaging/api";
import type { MessageFilters, MessageItem } from "@/lib/messaging/types";
import { cn } from "@/lib/utils";

const channelIcons = {
  whatsapp: Smartphone,
  email: Mail,
  sms: Phone,
} as const;

const channelLabels = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  sms: "SMS",
} as const;

const directionIcons = {
  inbound: ArrowDownLeft,
  outbound: ArrowUpRight,
} as const;

const directionLabels = {
  inbound: "Recebida",
  outbound: "Enviada",
} as const;

function MessageRow({ message }: { message: MessageItem }) {
  const ChannelIcon =
    channelIcons[message.channel as keyof typeof channelIcons] ?? MessageCircle;
  const DirectionIcon =
    directionIcons[message.direction as keyof typeof directionIcons] ??
    MessageCircle;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
      case "sent":
        return "bg-green-500/10 text-green-600";
      case "failed":
      case "error":
        return "bg-destructive/10 text-destructive";
      case "pending":
      case "queued":
        return "bg-amber-500/10 text-amber-600";
      default:
        return "bg-foreground/10 text-foreground";
    }
  };

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 px-4 py-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          message.direction === "inbound"
            ? "bg-blue-500/10 text-blue-600"
            : "bg-green-500/10 text-green-600",
        )}
      >
        <DirectionIcon className="size-4" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-5 items-center justify-center rounded bg-foreground/10 text-[10px]">
            <ChannelIcon className="size-3" />
          </span>
          <span className="text-sm font-medium text-foreground">
            {message.sender ?? message.recipient ?? "-"}
          </span>
          <Badge
            variant="secondary"
            className={cn("text-[10px]", getStatusColor(message.status))}
          >
            {message.status}
          </Badge>
        </div>

        {message.subject && (
          <p className="text-sm font-medium text-foreground/80">
            {message.subject}
          </p>
        )}

        {message.body_text && (
          <p className="truncate text-sm text-muted-foreground">
            {message.body_text}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            {formatDate(
              message.sent_at ?? message.received_at ?? message.created_at,
            )}
          </span>
          {message.template_code && (
            <span className="rounded bg-foreground/10 px-1.5 py-0.5">
              {message.template_code}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageFiltersBar({
  filters,
  onChange,
  onReset,
}: {
  filters: MessageFilters;
  onChange: (filters: MessageFilters) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters =
    filters.channel || filters.direction || filters.status;

  const handleChannelChange = (channel: string) => {
    onChange({
      ...filters,
      channel: filters.channel === channel ? undefined : channel,
    });
  };

  const handleDirectionChange = (direction: string) => {
    onChange({
      ...filters,
      direction: filters.direction === direction ? undefined : direction,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <Filter className="size-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-background/20 text-[10px]">
                !
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Canal</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(channelLabels).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChannelChange(value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    filters.channel === value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/70 bg-transparent text-foreground hover:border-foreground/50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Direção</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(directionLabels).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleDirectionChange(value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    filters.direction === value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/70 bg-transparent text-foreground hover:border-foreground/50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <>
              <Separator />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onReset();
                  setOpen(false);
                }}
                className="w-full"
              >
                <X className="size-4" />
                Limpar filtros
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function MessagesView() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<MessageFilters>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMessages = useCallback(
    async (currentFilters: MessageFilters = {}) => {
      setIsLoading(true);
      try {
        const data = await getMessages(currentFilters);
        setMessages(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Erro ao carregar mensagens.");
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadMessages(filters);
      toast.success("Mensagens atualizadas.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadMessages(filters);
  }, [loadMessages, filters]);

  const handleFiltersChange = (newFilters: MessageFilters) => {
    setFilters(newFilters);
  };

  const handleFiltersReset = () => {
    setFilters({});
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="bg-card/85 shadow-sm">
            <CardContent className="grid gap-3 pt-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
          <Card className="bg-card/85 shadow-sm lg:col-span-2">
            <CardContent className="flex min-h-64 items-center justify-center pt-6">
              <div className="inline-flex items-center gap-3 text-sm text-muted-foreground">
                <RefreshCcw className="size-4 animate-spin" />
                Carregando mensagens...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="grid gap-3 pt-5">
            <Badge variant="secondary">Total</Badge>
            <p className="font-serif text-4xl tracking-tight text-foreground">
              {messages.length}
            </p>
            <p className="text-sm text-muted-foreground">
              Mensagens no histórico
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/85 shadow-sm lg:col-span-2">
          <CardContent className="grid gap-3 pt-5">
            <Badge variant="outline">Canais ativos</Badge>
            <div className="flex gap-4">
              {(["whatsapp", "email", "sms"] as const).map((channel) => {
                const count = messages.filter(
                  (m) => m.channel === channel,
                ).length;
                const Icon = channelIcons[channel];
                return (
                  <div key={channel} className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {channelLabels[channel]}: {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/85 shadow-sm">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle>Histórico de mensagens</CardTitle>
              <CardDescription>
                Acompanhe todas as mensagens enviadas e recebidas.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MessageFiltersBar
                filters={filters}
                onChange={handleFiltersChange}
                onReset={handleFiltersReset}
              />
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
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {messages.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageCircle className="size-4" />
                </EmptyMedia>
                <EmptyTitle>Nenhuma mensagem encontrada</EmptyTitle>
                <EmptyDescription>
                  {Object.keys(filters).length > 0
                    ? "Tente ajustar os filtros para ver mais resultados."
                    : "As mensagens aparecerão aqui quando houver atividade."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <MessageRow key={message.id} message={message} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
