"use client";

import { AlertTriangle, LineChart, Loader2, ReceiptText } from "lucide-react";
import { type ComponentType, useEffect, useState } from "react";

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
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import {
  getApiRequestLogs,
  getApiRequestMetrics,
} from "@/lib/observability/api";
import {
  buildApiRequestLogsQuery,
  buildApiRequestMetricsQuery,
  type ObservabilityLogFilters,
  type ObservabilityMetricFilters,
} from "@/lib/observability/explorer";
import {
  formatDateTime,
  formatDuration,
  formatRequestCount,
  getApiMetricAverageDuration,
  getStatusTone,
} from "@/lib/observability/format";
import type {
  ApiRequestLogItem,
  ApiRequestMetricItem,
} from "@/lib/observability/types";
import { cn } from "@/lib/utils";

const METHOD_OPTIONS = ["", "GET", "POST", "PATCH", "PUT", "DELETE"] as const;

const DEFAULT_LOG_FILTERS: ObservabilityLogFilters = {
  method: "",
  statusCode: "",
  routePath: "",
  requestId: "",
  limit: "30",
};

const DEFAULT_METRIC_FILTERS: ObservabilityMetricFilters = {
  method: "",
  statusCode: "",
  routePath: "",
  limit: "120",
};

type ObservabilityExplorerProps = {
  hours: number;
  canReadLogs: boolean;
  canReadMetrics: boolean;
};

function StatusPill({ statusCode }: { statusCode: number }) {
  const tone = getStatusTone({
    status_code: statusCode,
    total_requests: 1,
    error_requests: statusCode >= 400 ? 1 : 0,
  });

  return (
    <Badge
      variant={
        tone === "destructive"
          ? "destructive"
          : tone === "warning"
            ? "outline"
            : "secondary"
      }
      className={cn(
        tone === "warning" ? "border-chart-4 text-chart-4" : undefined,
      )}
    >
      {statusCode}
    </Badge>
  );
}

function NoAccessCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="bg-card/85 shadow-sm">
      <CardContent className="pt-6">
        <Empty className="border border-border/70 bg-background/70">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon className="size-4" />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-52 items-center justify-center gap-3 rounded-[1.5rem] border border-border/70 bg-background/70">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export function ObservabilityExplorer({
  hours,
  canReadLogs,
  canReadMetrics,
}: ObservabilityExplorerProps) {
  const [logFilters, setLogFilters] =
    useState<ObservabilityLogFilters>(DEFAULT_LOG_FILTERS);
  const [metricFilters, setMetricFilters] =
    useState<ObservabilityMetricFilters>(DEFAULT_METRIC_FILTERS);
  const [appliedLogFilters, setAppliedLogFilters] =
    useState<ObservabilityLogFilters>(DEFAULT_LOG_FILTERS);
  const [appliedMetricFilters, setAppliedMetricFilters] =
    useState<ObservabilityMetricFilters>(DEFAULT_METRIC_FILTERS);
  const [logs, setLogs] = useState<ApiRequestLogItem[]>([]);
  const [metrics, setMetrics] = useState<ApiRequestMetricItem[]>([]);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  useEffect(() => {
    if (!canReadLogs) {
      return;
    }

    let isActive = true;

    async function loadLogs() {
      setIsLoadingLogs(true);
      setLogsError(null);

      try {
        const nextLogs = await getApiRequestLogs(
          buildApiRequestLogsQuery(appliedLogFilters),
        );

        if (!isActive) {
          return;
        }

        setLogs(nextLogs);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const presentation = formatApiErrorMessage(error, {
          fallbackTitle: "Não foi possível carregar os logs agora.",
        });
        setLogs([]);
        setLogsError(
          presentation.description
            ? `${presentation.title} ${presentation.description}`
            : presentation.title,
        );
      } finally {
        if (isActive) {
          setIsLoadingLogs(false);
        }
      }
    }

    void loadLogs();

    return () => {
      isActive = false;
    };
  }, [appliedLogFilters, canReadLogs]);

  useEffect(() => {
    if (!canReadMetrics) {
      return;
    }

    let isActive = true;

    async function loadMetrics() {
      setIsLoadingMetrics(true);
      setMetricsError(null);

      try {
        const nextMetrics = await getApiRequestMetrics(
          buildApiRequestMetricsQuery(appliedMetricFilters, hours),
        );

        if (!isActive) {
          return;
        }

        setMetrics(nextMetrics);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const presentation = formatApiErrorMessage(error, {
          fallbackTitle: "Não foi possível carregar as métricas agora.",
        });
        setMetrics([]);
        setMetricsError(
          presentation.description
            ? `${presentation.title} ${presentation.description}`
            : presentation.title,
        );
      } finally {
        if (isActive) {
          setIsLoadingMetrics(false);
        }
      }
    }

    void loadMetrics();

    return () => {
      isActive = false;
    };
  }, [appliedMetricFilters, canReadMetrics, hours]);

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {canReadLogs ? (
        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Logs da API
            </Badge>
            <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
              Explorer de requests
            </CardTitle>
            <CardDescription className="leading-7">
              Filtre a trilha recente de chamadas do workspace por método,
              status, rota ou request id.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <FieldGroup className="gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel>Método</FieldLabel>
                  <FieldContent>
                    <select
                      className="h-11 w-full rounded-[1rem] border border-border/70 bg-background px-4 text-sm text-foreground outline-none transition focus:border-foreground/30"
                      value={logFilters.method}
                      onChange={(event) =>
                        setLogFilters((current) => ({
                          ...current,
                          method: event.target.value,
                        }))
                      }
                    >
                      {METHOD_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option || "Todos"}
                        </option>
                      ))}
                    </select>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>Status HTTP</FieldLabel>
                  <FieldContent>
                    <Input
                      value={logFilters.statusCode}
                      onChange={(event) =>
                        setLogFilters((current) => ({
                          ...current,
                          statusCode: event.target.value,
                        }))
                      }
                      placeholder="Ex.: 401"
                      inputMode="numeric"
                    />
                  </FieldContent>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
                <Field>
                  <FieldLabel>Rota</FieldLabel>
                  <FieldContent>
                    <Input
                      value={logFilters.routePath}
                      onChange={(event) =>
                        setLogFilters((current) => ({
                          ...current,
                          routePath: event.target.value,
                        }))
                      }
                      placeholder="Ex.: /api/v1/auth/login"
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>Limite</FieldLabel>
                  <FieldContent>
                    <Input
                      value={logFilters.limit}
                      onChange={(event) =>
                        setLogFilters((current) => ({
                          ...current,
                          limit: event.target.value,
                        }))
                      }
                      inputMode="numeric"
                    />
                    <FieldDescription>
                      Máximo de 200 registros.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </div>

              <Field>
                <FieldLabel>Request ID</FieldLabel>
                <FieldContent>
                  <Input
                    value={logFilters.requestId}
                    onChange={(event) =>
                      setLogFilters((current) => ({
                        ...current,
                        requestId: event.target.value,
                      }))
                    }
                    placeholder="Ex.: f9de65063561696b6a2db8809f2bea51"
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => setAppliedLogFilters(logFilters)}
                disabled={isLoadingLogs}
              >
                Aplicar filtros
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLogFilters(DEFAULT_LOG_FILTERS);
                  setAppliedLogFilters(DEFAULT_LOG_FILTERS);
                }}
                disabled={isLoadingLogs}
              >
                Limpar
              </Button>
            </div>

            {isLoadingLogs ? (
              <LoadingState label="Carregando logs da API..." />
            ) : logsError ? (
              <Empty className="border border-border/70 bg-background/70">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <AlertTriangle className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Não foi possível carregar os logs</EmptyTitle>
                  <EmptyDescription>{logsError}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : logs.length === 0 ? (
              <Empty className="border border-border/70 bg-background/70">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ReceiptText className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum log encontrado</EmptyTitle>
                  <EmptyDescription>
                    Ajuste os filtros ou aguarde novas requisições serem
                    registradas no workspace.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDateTime(item.created_at)}</TableCell>
                      <TableCell>
                        <StatusPill statusCode={item.status_code} />
                      </TableCell>
                      <TableCell>{item.method}</TableCell>
                      <TableCell className="max-w-[15rem]">
                        <div className="truncate text-foreground">
                          {item.route_path}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[12rem]">
                        <div className="truncate text-muted-foreground">
                          {item.request_id}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[18rem]">
                        <div className="truncate text-muted-foreground">
                          {item.error_detail ?? "Sem detalhe"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <NoAccessCard
          title="Logs indisponíveis"
          description="Você não tem permissão para consultar a trilha de requests deste workspace."
          icon={ReceiptText}
        />
      )}

      {canReadMetrics ? (
        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Métricas da API
            </Badge>
            <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
              Explorer de agregados
            </CardTitle>
            <CardDescription className="leading-7">
              Consulte buckets agregados por minuto para o recorte ativo de{" "}
              <strong>{hours}h</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <FieldGroup className="gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel>Método</FieldLabel>
                  <FieldContent>
                    <select
                      className="h-11 w-full rounded-[1rem] border border-border/70 bg-background px-4 text-sm text-foreground outline-none transition focus:border-foreground/30"
                      value={metricFilters.method}
                      onChange={(event) =>
                        setMetricFilters((current) => ({
                          ...current,
                          method: event.target.value,
                        }))
                      }
                    >
                      {METHOD_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option || "Todos"}
                        </option>
                      ))}
                    </select>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>Status HTTP</FieldLabel>
                  <FieldContent>
                    <Input
                      value={metricFilters.statusCode}
                      onChange={(event) =>
                        setMetricFilters((current) => ({
                          ...current,
                          statusCode: event.target.value,
                        }))
                      }
                      placeholder="Ex.: 200"
                      inputMode="numeric"
                    />
                  </FieldContent>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
                <Field>
                  <FieldLabel>Rota</FieldLabel>
                  <FieldContent>
                    <Input
                      value={metricFilters.routePath}
                      onChange={(event) =>
                        setMetricFilters((current) => ({
                          ...current,
                          routePath: event.target.value,
                        }))
                      }
                      placeholder="Ex.: /api/v1/messages"
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>Limite</FieldLabel>
                  <FieldContent>
                    <Input
                      value={metricFilters.limit}
                      onChange={(event) =>
                        setMetricFilters((current) => ({
                          ...current,
                          limit: event.target.value,
                        }))
                      }
                      inputMode="numeric"
                    />
                    <FieldDescription>Máximo de 500 linhas.</FieldDescription>
                  </FieldContent>
                </Field>
              </div>
            </FieldGroup>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => setAppliedMetricFilters(metricFilters)}
                disabled={isLoadingMetrics}
              >
                Aplicar filtros
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMetricFilters(DEFAULT_METRIC_FILTERS);
                  setAppliedMetricFilters(DEFAULT_METRIC_FILTERS);
                }}
                disabled={isLoadingMetrics}
              >
                Limpar
              </Button>
            </div>

            {isLoadingMetrics ? (
              <LoadingState label="Carregando métricas da API..." />
            ) : metricsError ? (
              <Empty className="border border-border/70 bg-background/70">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <AlertTriangle className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Não foi possível carregar as métricas</EmptyTitle>
                  <EmptyDescription>{metricsError}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : metrics.length === 0 ? (
              <Empty className="border border-border/70 bg-background/70">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <LineChart className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhuma métrica encontrada</EmptyTitle>
                  <EmptyDescription>
                    Esse recorte ainda não gerou buckets compatíveis com os
                    filtros escolhidos.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bucket</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Erros</TableHead>
                    <TableHead>Média</TableHead>
                    <TableHead>Pico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDateTime(item.bucket_start)}</TableCell>
                      <TableCell>
                        <StatusPill statusCode={item.status_code} />
                      </TableCell>
                      <TableCell>{item.method}</TableCell>
                      <TableCell className="max-w-[14rem]">
                        <div className="truncate text-foreground">
                          {item.route_path}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatRequestCount(item.total_requests)}
                      </TableCell>
                      <TableCell>
                        {formatRequestCount(item.error_requests)}
                      </TableCell>
                      <TableCell>
                        {formatDuration(getApiMetricAverageDuration(item))}
                      </TableCell>
                      <TableCell>
                        {formatDuration(item.max_duration_ms)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <NoAccessCard
          title="Métricas indisponíveis"
          description="Você não tem permissão para consultar métricas agregadas deste workspace."
          icon={LineChart}
        />
      )}
    </section>
  );
}
