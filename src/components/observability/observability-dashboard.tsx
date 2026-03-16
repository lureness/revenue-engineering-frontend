"use client";

import {
  Activity,
  AlertTriangle,
  Gauge,
  Loader2,
  Radar,
  Route,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
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
  getObservabilityDashboardView,
  getObservabilityDashboardViews,
} from "@/lib/observability/api";
import {
  formatCompactTime,
  formatDateTime,
  formatDuration,
  formatPercentage,
  formatRequestCount,
  getStatusTone,
  getTimeseriesBarHeight,
  getTimeseriesErrorHeight,
  getTimeseriesPeak,
} from "@/lib/observability/format";
import type {
  ApiRequestLogItem,
  ObservabilityDashboardInsightGroupItem,
  ObservabilityDashboardRouteItem,
  ObservabilityDashboardStatusItem,
  ObservabilityDashboardViewDefinitionItem,
  ObservabilityDashboardViewItem,
} from "@/lib/observability/types";
import { cn } from "@/lib/utils";

const HOURS_OPTIONS = [
  { label: "24h", value: 24 },
  { label: "72h", value: 72 },
  { label: "7d", value: 168 },
] as const;

type DashboardMetricCardProps = {
  label: string;
  value: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

function DashboardMetricCard({
  label,
  value,
  description,
  icon: Icon,
}: DashboardMetricCardProps) {
  return (
    <Card className="bg-card/85 shadow-sm">
      <CardContent className="grid gap-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary">{label}</Badge>
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background">
            <Icon className="size-4" />
          </span>
        </div>
        <div className="space-y-2">
          <p className="font-serif text-4xl tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightGroupCard({
  group,
}: {
  group: ObservabilityDashboardInsightGroupItem;
}) {
  return (
    <Card className="bg-card/85 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg tracking-tight text-foreground">
          {group.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {group.metrics.map((metric) => (
          <div
            key={metric.key}
            className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {metric.label}
                </p>
                {metric.description ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {metric.description}
                  </p>
                ) : null}
              </div>
              <span className="font-serif text-2xl tracking-tight text-foreground">
                {typeof metric.value === "number"
                  ? formatRequestCount(metric.value)
                  : metric.value}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ item }: { item: ObservabilityDashboardStatusItem }) {
  const tone = getStatusTone(item);

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
      {item.status_code}
    </Badge>
  );
}

function TimeseriesChart({
  dashboard,
}: {
  dashboard: ObservabilityDashboardViewItem;
}) {
  const peak = getTimeseriesPeak(dashboard.timeseries);

  return (
    <Card className="bg-card/85 shadow-sm">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Série temporal
        </Badge>
        <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
          Tráfego da view ao longo da janela
        </CardTitle>
        <CardDescription className="leading-7">
          Cada coluna representa o total de requisições por bucket. A faixa
          interna destaca o volume de erros nesse mesmo intervalo.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid min-h-60 grid-cols-[repeat(auto-fit,minmax(10px,1fr))] items-end gap-2 rounded-[1.5rem] border border-border/70 bg-background/70 px-4 py-5">
          {dashboard.timeseries.map((item) => {
            const totalHeight = getTimeseriesBarHeight(item, peak);
            const errorHeight = getTimeseriesErrorHeight(item, peak);

            return (
              <div
                key={item.bucket_start}
                className="group flex min-w-0 flex-col items-center gap-2"
                title={`${formatCompactTime(item.bucket_start)} · ${formatRequestCount(item.total_requests)} requisições`}
              >
                <div className="flex h-40 w-full items-end justify-center">
                  <div
                    className="relative w-full max-w-5 rounded-full bg-chart-2/25"
                    style={{ height: `${totalHeight}%` }}
                  >
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-full bg-chart-4"
                      style={{ height: `${errorHeight}%` }}
                    />
                  </div>
                </div>
                <span className="text-[0.68rem] font-medium text-muted-foreground">
                  {formatCompactTime(item.bucket_start)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-chart-2/50" />
            Requisições totais
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-chart-4" />
            Requisições com erro
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function TopRoutesTable({
  routes,
}: {
  routes: ObservabilityDashboardRouteItem[];
}) {
  if (routes.length === 0) {
    return (
      <Empty className="border border-border/70 bg-background/70">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Route className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Nenhuma rota ativa na janela</EmptyTitle>
          <EmptyDescription>
            Assim que a aplicação gerar tráfego nesse recorte, as rotas mais
            usadas aparecem aqui.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rota</TableHead>
          <TableHead>Requisições</TableHead>
          <TableHead>Erros</TableHead>
          <TableHead>Duração média</TableHead>
          <TableHead>Pico</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {routes.map((item) => (
          <TableRow key={item.route_path}>
            <TableCell className="max-w-[18rem]">
              <div className="truncate font-medium text-foreground">
                {item.route_path}
              </div>
            </TableCell>
            <TableCell>{formatRequestCount(item.total_requests)}</TableCell>
            <TableCell>{formatRequestCount(item.error_requests)}</TableCell>
            <TableCell>{formatDuration(item.average_duration_ms)}</TableCell>
            <TableCell>{formatDuration(item.max_duration_ms)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RecentErrorsList({ errors }: { errors: ApiRequestLogItem[] }) {
  if (errors.length === 0) {
    return (
      <Empty className="border border-border/70 bg-background/70">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldAlert className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Nenhum erro recente</EmptyTitle>
          <EmptyDescription>
            Nesse recorte, a view não registrou falhas recentes.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-3">
      {errors.map((item) => (
        <div
          key={item.id}
          className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{item.status_code}</Badge>
                <span className="text-sm font-medium text-foreground">
                  {item.method} {item.route_path}
                </span>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {item.error_detail ?? "Erro sem detalhe adicional."}
              </p>
            </div>
            <div className="text-right text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <div>{formatDateTime(item.created_at)}</div>
              <div className="mt-1">{formatDuration(item.duration_ms)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ObservabilityDashboard() {
  const [views, setViews] = useState<
    ObservabilityDashboardViewDefinitionItem[]
  >([]);
  const [selectedViewCode, setSelectedViewCode] = useState("platform");
  const [selectedHours, setSelectedHours] = useState(24);
  const [dashboard, setDashboard] =
    useState<ObservabilityDashboardViewItem | null>(null);
  const [isLoadingViews, setIsLoadingViews] = useState(true);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadViews() {
      setIsLoadingViews(true);
      setErrorMessage(null);

      try {
        const nextViews = await getObservabilityDashboardViews();

        if (!isActive) {
          return;
        }

        setViews(nextViews);
        setSelectedViewCode((currentValue) => {
          if (
            nextViews.length > 0 &&
            !nextViews.some((view) => view.code === currentValue)
          ) {
            return nextViews[0].code;
          }

          return currentValue;
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        const presentation = formatApiErrorMessage(error, {
          fallbackTitle: "Não foi possível carregar as views do dashboard.",
        });
        setErrorMessage(
          presentation.description
            ? `${presentation.title} ${presentation.description}`
            : presentation.title,
        );
      } finally {
        if (isActive) {
          setIsLoadingViews(false);
        }
      }
    }

    void loadViews();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      setIsLoadingDashboard(true);
      setErrorMessage(null);

      try {
        const nextDashboard = await getObservabilityDashboardView(
          selectedViewCode,
          {
            hours: selectedHours,
            top_routes_limit: 8,
            recent_errors_limit: 6,
          },
        );

        if (!isActive) {
          return;
        }

        setDashboard(nextDashboard);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setDashboard(null);
        const presentation = formatApiErrorMessage(error, {
          fallbackTitle: "Não foi possível carregar o dashboard.",
        });
        setErrorMessage(
          presentation.description
            ? `${presentation.title} ${presentation.description}`
            : presentation.title,
        );
      } finally {
        if (isActive) {
          setIsLoadingDashboard(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, [selectedHours, selectedViewCode]);

  if (isLoadingViews && !views.length) {
    return (
      <Card className="bg-card/85 shadow-md">
        <CardContent className="flex min-h-80 items-center justify-center gap-3 pt-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Carregando o dashboard de observabilidade...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (errorMessage && !dashboard) {
    return (
      <Empty className="border border-border/70 bg-card/85 shadow-sm">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertTriangle className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Não foi possível abrir o dashboard</EmptyTitle>
          <EmptyDescription>{errorMessage}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <div className="grid gap-6">
      <Card className="rounded-[2rem] bg-card/85 shadow-md">
        <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Badge variant="secondary">Observability dashboard</Badge>
            <div className="space-y-3">
              <h2 className="font-serif text-4xl tracking-tight text-foreground md:text-5xl">
                {dashboard.view.name}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                {dashboard.view.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {views.map((view) => (
                <Button
                  key={view.code}
                  type="button"
                  variant={
                    view.code === selectedViewCode ? "secondary" : "outline"
                  }
                  onClick={() => setSelectedViewCode(view.code)}
                  disabled={isLoadingDashboard}
                >
                  {view.name}
                </Button>
              ))}
            </div>
          </div>

          <Card className="bg-background/70">
            <CardContent className="grid gap-4 pt-4">
              <div className="space-y-2">
                <Badge variant="outline">Janela</Badge>
                <p className="text-sm leading-7 text-muted-foreground">
                  {formatDateTime(dashboard.window_start)} até{" "}
                  {formatDateTime(dashboard.window_end)}
                </p>
              </div>
              <Separator />
              <div className="space-y-3">
                <Badge variant="secondary">Recorte</Badge>
                <div className="flex flex-wrap gap-2">
                  {HOURS_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={
                        option.value === selectedHours ? "secondary" : "outline"
                      }
                      onClick={() => setSelectedHours(option.value)}
                      disabled={isLoadingDashboard}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              {errorMessage ? (
                <>
                  <Separator />
                  <p className="text-sm leading-7 text-muted-foreground">
                    {errorMessage}
                  </p>
                </>
              ) : null}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DashboardMetricCard
          label="Requisições"
          value={formatRequestCount(dashboard.summary.total_requests)}
          description="Volume total registrado para a view na janela."
          icon={Activity}
        />
        <DashboardMetricCard
          label="Sucesso"
          value={formatRequestCount(dashboard.summary.success_requests)}
          description="Chamadas concluídas sem erro HTTP."
          icon={TrendingUp}
        />
        <DashboardMetricCard
          label="Erros"
          value={formatRequestCount(dashboard.summary.error_requests)}
          description="Falhas 4xx e 5xx acumuladas nesse recorte."
          icon={ShieldAlert}
        />
        <DashboardMetricCard
          label="Taxa de erro"
          value={formatPercentage(dashboard.summary.error_rate)}
          description="Percentual total de erros em relação ao tráfego."
          icon={Radar}
        />
        <DashboardMetricCard
          label="Latência média"
          value={formatDuration(dashboard.summary.average_duration_ms)}
          description="Tempo médio de resposta observado na view."
          icon={Gauge}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <TimeseriesChart dashboard={dashboard} />

        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Breakdown
            </Badge>
            <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
              Status HTTP observados
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dashboard.status_breakdown.map((item) => (
              <div
                key={item.status_code}
                className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge item={item} />
                    <span className="text-sm font-medium text-foreground">
                      {formatRequestCount(item.total_requests)} requisições
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatRequestCount(item.error_requests)} erros
                  </span>
                </div>
              </div>
            ))}

            <Separator />

            <div className="grid gap-3 md:grid-cols-2">
              {dashboard.insights.map((group) => (
                <InsightGroupCard key={group.code} group={group} />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Top routes
            </Badge>
            <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
              Rotas mais acionadas na view
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopRoutesTable routes={dashboard.top_routes} />
          </CardContent>
        </Card>

        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Recent errors
            </Badge>
            <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
              Erros mais recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentErrorsList errors={dashboard.recent_errors} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
