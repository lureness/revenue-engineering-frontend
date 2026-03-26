import {
  ArrowRight,
  BarChart3,
  BadgeCheck,
  BrainCircuit,
  Building2,
  CircleDollarSign,
  Gauge,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  Workflow,
} from "lucide-react";
import Link from "next/link";

import { LurenessMark } from "@/components/brand/lureness-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

const primaryActionClassName =
  "inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform duration-200 hover:-translate-y-0.5";

const secondaryActionClassName =
  "inline-flex items-center justify-center gap-2 rounded-full border border-foreground/15 bg-card/80 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted";

const painPoints = [
  {
    number: "01",
    title: "Desalinhamento entre atração, conversão e fidelização",
    description:
      "Branding, marketing, vendas e sucesso do cliente operam sem uma narrativa única. O resultado é CAC pressionado, pitch repetido e perda de eficiência ao longo da jornada.",
    tone: "from-red-500/90 to-orange-500/90",
  },
  {
    number: "02",
    title: "Falta de ritmo, prestação de contas e previsibilidade",
    description:
      "Sem rituais, playbooks, KPIs e responsabilidades claras, o crescimento depende demais de esforço individual e pouco de sistema operacional de receita.",
    tone: "from-orange-500/90 to-amber-500/90",
  },
  {
    number: "03",
    title: "Desperdício silencioso de tempo e recurso",
    description:
      "Processos fragmentados geram retrabalho, lentidão comercial e pouca visibilidade sobre o que realmente move a receita na direção certa.",
    tone: "from-amber-500/90 to-yellow-500/90",
  },
] as const;

const valueStats = [
  {
    value: "+15%",
    label: "Mais lucratividade",
    icon: CircleDollarSign,
  },
  {
    value: "+30%",
    label: "Mais agilidade na venda",
    icon: Gauge,
  },
  {
    value: "-20%",
    label: "Menor custo de aquisição",
    icon: Target,
  },
] as const;

const pillars = [
  {
    title: "Inteligência e Ativos de Marca",
    description:
      "Posicionamento, narrativa e autoridade para reduzir fricção comercial e elevar percepção de valor.",
    items: [
      "Branding e reposicionamento de mercado",
      "Mensagens-chave e alinhamento institucional",
      "Autoridade executiva e CEO positioning",
    ],
    icon: Sparkles,
  },
  {
    title: "Engenharia de Aquisição e Receita",
    description:
      "Desenho da infraestrutura que transforma interesse em faturamento previsível.",
    items: [
      "Arquitetura de funil, ICP e buyer journey",
      "Onboarding, expansão e jornadas de retenção",
      "Growth unificado com canais, playbooks e parceiros",
    ],
    icon: Workflow,
  },
  {
    title: "Execução autônoma na trincheira",
    description:
      "Implementação prática para garantir que o sistema comercial se sustente no dia a dia.",
    items: [
      "Rituais, indicadores e gestão operacional",
      "Treinamento técnico de lideranças e squads",
      "Estrutura organizacional e responsabilidades claras",
    ],
    icon: ShieldCheck,
  },
] as const;

const method = [
  {
    step: "01",
    title: "Diagnóstico e alinhamento de ativos",
    description: "Paramos o vazamento e definimos o alvo.",
    items: [
      "Leitura do negócio, mercado e concorrência",
      "Definição da meta central e dos ativos prioritários",
      "Auditoria dos processos atuais de receita",
    ],
    icon: BrainCircuit,
  },
  {
    step: "02",
    title: "Engenharia e ajuste das máquinas",
    description: "Construímos a infraestrutura de escala.",
    items: [
      "Ajuste de branding, mensagem e canais",
      "Otimização do funil, playbooks e conversão",
      "Estrutura de onboarding, retenção e LTV",
    ],
    icon: LineChart,
  },
  {
    step: "03",
    title: "Sustentação e autonomia",
    description: "Entregamos autonomia para a operação.",
    items: [
      "Treinamento intensivo do time na trincheira",
      "Entrega de dashboards, KPIs e processos",
      "Tecnologia configurada para continuidade",
    ],
    icon: UsersRound,
  },
] as const;

const differentials = [
  {
    title: "Cultura de trincheira",
    description:
      "Não entregamos só diagnóstico. Entramos na operação para transformar o jeito de fazer até que o time consiga sustentar a máquina sem dependência excessiva.",
    icon: UsersRound,
  },
  {
    title: "Processos que importam",
    description:
      "Padronizamos os movimentos de aquisição, vendas e pós-venda para trocar improviso por previsibilidade, ritmo e accountability.",
    icon: Workflow,
  },
  {
    title: "Foco em LTV/CAC",
    description:
      "A engenharia é desenhada para aumentar velocidade comercial sem sacrificar margem, marca ou retenção.",
    icon: BarChart3,
  },
  {
    title: "Senioridade aplicada",
    description:
      "A tomada de decisão nasce de repertório executivo, operação real e clareza de unidade econômica — não de modismo de crescimento.",
    icon: BadgeCheck,
  },
] as const;

const audience = [
  "Empresas com operação comercial travada entre marketing, vendas e sucesso do cliente.",
  "Negócios que já investem em aquisição, mas ainda não transformam esforço em previsibilidade.",
  "Lideranças que precisam de estrutura, playbooks, KPIs e narrativa para crescer com eficiência.",
] as const;

export default function LandingPage() {
  return (
    <main className="page-frame bg-lureness-glow text-foreground">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-25" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-140 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_36%),radial-gradient(circle_at_top_left,rgba(236,72,153,0.10),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.06),transparent)] dark:bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.24),transparent_36%),radial-gradient(circle_at_top_left,rgba(236,72,153,0.16),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.24),transparent)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 pb-10 md:flex-row md:items-center md:justify-between">
          <LurenessMark />

          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <a
              href="#solucao"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Solução
            </a>
            <a
              href="#como-fazemos"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Como fazemos
            </a>
            <a
              href="#diferenciais"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Diferenciais
            </a>
            <Link href="/diagnostico" className={primaryActionClassName}>
              Fazer diagnóstico
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-10 pb-16 pt-4 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 lg:pb-24">
          <div className="space-y-8">
            <div className="space-y-5">
              <p className="eyebrow">Engenharia de Receita</p>
              <h1 className="max-w-5xl font-serif text-5xl leading-[0.95] tracking-tight text-foreground md:text-7xl">
                Não é sobre <span className="gradient-text">gastar mais</span>.
                <br />É sobre estancar o desperdício e acelerar o crescimento
                eficiente.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Diagnosticamos e solucionamos os pontos de fricção entre
                atração, conversão e fidelização para transformar marca,
                marketing, vendas e pós-venda em um sistema previsível de
                receita.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/diagnostico" className={primaryActionClassName}>
                Faça seu diagnóstico de viabilidade
                <ArrowRight className="size-4" />
              </Link>
              <a href="#solucao" className={secondaryActionClassName}>
                Ver como funciona
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {valueStats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <Card
                    key={stat.label}
                    className="overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur"
                  >
                    <CardContent className="pt-5">
                      <div className="mb-4 inline-flex size-11 items-center justify-center rounded-2xl bg-foreground text-background">
                        <Icon className="size-5" />
                      </div>
                      <div className="bg-linear-to-r from-pink-500 via-fuchsia-500 to-violet-500 bg-clip-text text-4xl font-semibold tracking-tight text-transparent md:text-5xl">
                        {stat.value}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {stat.label}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="glow-border rounded-4xl border-border/60 bg-zinc-950 text-zinc-50 shadow-md">
              <CardContent className="space-y-6 p-7">
                <div className="space-y-3">
                  <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">
                    Marcas fortes geram lucro
                  </Badge>
                  <h2 className="font-serif text-3xl leading-tight tracking-tight md:text-4xl">
                    Estratégia, infraestrutura e mentoria para construir receita
                    com clareza.
                  </h2>
                  <p className="text-sm leading-7 text-zinc-400">
                    A Engenharia de Receita conecta posicionamento, operação e
                    execução para reduzir CAC, acelerar vendas e aumentar
                    eficiência real na máquina comercial.
                  </p>
                </div>

                <div className="grid gap-3">
                  {[
                    "Branding",
                    "CEO Positioning",
                    "Engenharia de Receita",
                    "Marketing",
                    "Vendas",
                    "Sucesso do Cliente",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-4xl border-border/60 bg-card/85 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm leading-7 text-muted-foreground">
                  A meta é simples: organizar a unidade econômica para que o
                  crescimento se pague mais rápido, com menos fricção e mais
                  clareza sobre o que gera resultado.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section
          className="grid gap-5 border-t border-border/70 py-16"
          id="dores"
        >
          <div className="max-w-3xl space-y-3">
            <p className="eyebrow">Onde o crescimento trava</p>
            <h2 className="section-title text-4xl md:text-5xl">
              Antes de acelerar, é preciso fechar os vazamentos que drenam a
              receita.
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {painPoints.map((point) => (
              <Card
                key={point.number}
                className="overflow-hidden rounded-4xl border-0 bg-card/80 shadow-sm"
              >
                <div className={`h-2 w-full bg-linear-to-r ${point.tone}`} />
                <CardContent className="p-6">
                  <div className="mb-4 text-5xl font-semibold tracking-tight text-foreground/90">
                    {point.number}
                  </div>
                  <h3 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
                    {point.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {point.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="solucao" className="grid gap-6 py-16">
          <div className="max-w-3xl space-y-3">
            <p className="eyebrow">Nossas soluções</p>
            <h2 className="section-title text-4xl md:text-5xl">
              A estrutura que conecta posicionamento, aquisição e execução.
            </h2>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;

              return (
                <Card
                  key={pillar.title}
                  className="rounded-4xl border-border/60 bg-card/85 shadow-sm"
                >
                  <CardHeader className="space-y-4">
                    <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-amber-400/20 via-fuchsia-500/20 to-violet-500/20 text-foreground">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                        {pillar.title}
                      </CardTitle>
                      <CardDescription className="mt-3 leading-7">
                        {pillar.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                      {pillar.items.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 size-1.5 rounded-full bg-linear-to-r from-amber-400 via-fuchsia-500 to-violet-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="py-16">
          <Card className="glow-border overflow-hidden rounded-4xl border-border/60 bg-zinc-950 text-zinc-50 shadow-md">
            <CardContent className="grid gap-8 p-8 md:grid-cols-[0.9fr_1.1fr] md:p-10">
              <div className="space-y-4">
                <p className="eyebrow text-zinc-400">Resultado esperado</p>
                <h2 className="font-serif text-4xl leading-none tracking-tight md:text-5xl">
                  Engenharia de Receita é o que pode levar seu negócio a operar
                  com mais margem e menos atrito.
                </h2>
              </div>

              <div className="space-y-5">
                {valueStats.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 px-5 py-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="bg-linear-to-r from-pink-500 via-fuchsia-500 to-violet-500 bg-clip-text text-5xl font-semibold tracking-tight text-transparent md:text-6xl">
                      {item.value}
                    </div>
                    <div className="text-lg text-zinc-200 md:text-right">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="como-fazemos" className="grid gap-6 py-16">
          <div className="max-w-3xl space-y-3">
            <p className="eyebrow">Como fazemos</p>
            <h2 className="section-title text-4xl md:text-5xl">
              Do diagnóstico à autonomia operacional.
            </h2>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {method.map((step) => {
              const Icon = step.icon;

              return (
                <Card
                  key={step.step}
                  className="rounded-4xl border-border/60 bg-card/85 shadow-sm"
                >
                  <CardHeader className="space-y-5">
                    <div className="inline-flex size-14 items-center justify-center rounded-3xl bg-linear-to-br from-pink-500/15 via-fuchsia-500/10 to-violet-500/15 text-foreground">
                      <Icon className="size-6" />
                    </div>
                    <div>
                      <p className="text-5xl font-semibold italic tracking-tight text-foreground">
                        {step.step}
                      </p>
                      <CardTitle className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                        {step.title}
                      </CardTitle>
                      <CardDescription className="mt-3 text-base leading-7">
                        {step.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                      {step.items.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 size-1.5 rounded-full bg-foreground/80" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="diferenciais" className="grid gap-6 py-16">
          <div className="max-w-3xl space-y-3">
            <p className="eyebrow">O que nos diferencia</p>
            <h2 className="section-title text-4xl md:text-5xl">
              Não entregamos só estratégia. Construímos capacidade real de
              execução.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {differentials.map((item) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.title}
                  className="rounded-4xl border-border/60 bg-card/85 shadow-sm"
                >
                  <CardHeader>
                    <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-pink-500/15 via-fuchsia-500/10 to-violet-500/15 text-foreground">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-7">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="py-16">
          <Card className="rounded-4xl border-border/60 bg-card/85 shadow-sm">
            <CardContent className="grid gap-8 p-8 md:grid-cols-[1fr_0.95fr] md:p-10">
              <div className="space-y-4">
                <p className="eyebrow">Para quem é</p>
                <h2 className="section-title text-4xl md:text-5xl">
                  Quando a empresa já cresceu o suficiente para perceber que
                  esforço sem sistema custa caro.
                </h2>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                  A Engenharia de Receita faz sentido para operações que já têm
                  demanda, time ou investimento comercial, mas ainda sofrem com
                  vazamentos entre posicionamento, aquisição, conversão e
                  retenção.
                </p>
              </div>

              <div className="grid gap-3">
                {audience.map((item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-border/60 bg-background/70 px-5 py-5 text-sm leading-7 text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}

                <div className="rounded-3xl border border-fuchsia-500/20 bg-linear-to-r from-pink-500/8 via-fuchsia-500/8 to-violet-500/8 px-5 py-5 text-sm leading-7 text-foreground">
                  A entrega combina diagnóstico, desenho de máquina,
                  priorização, implementação e treinamento para que a operação
                  não dependa de improviso.
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="pb-10 pt-16">
          <Card className="glow-border overflow-hidden rounded-4xl border-border/60 bg-zinc-950 text-zinc-50 shadow-md">
            <CardContent className="grid gap-8 p-8 md:grid-cols-[1fr_auto] md:items-end md:p-10">
              <div className="space-y-4">
                <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">
                  Vamos construir valor e diferenciação juntos
                </Badge>
                <h2 className="font-serif text-4xl leading-none tracking-tight md:text-6xl">
                  Faça seu diagnóstico de viabilidade e descubra onde a receita
                  está vazando hoje.
                </h2>
                <p className="max-w-2xl text-base leading-8 text-zinc-400">
                  O primeiro passo é entender onde o crescimento trava, quais
                  ativos já existem e como transformar operação comercial em uma
                  máquina mais lucrativa, ágil e previsível.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/diagnostico" className={primaryActionClassName}>
                  Fazer diagnóstico
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/login" className={secondaryActionClassName}>
                  Entrar
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="flex flex-col gap-4 border-t border-border/70 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={"/img/icon.png"}
              alt="Lureness"
              width={32}
              height={32}
              className="dark:invert-0 invert"
            />
            <span>Lureness · Revenue Intelligence</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <a
              href="#dores"
              className="transition-colors hover:text-foreground"
            >
              Diagnóstico
            </a>
            <a
              href="#solucao"
              className="transition-colors hover:text-foreground"
            >
              Soluções
            </a>
            <a
              href="#como-fazemos"
              className="transition-colors hover:text-foreground"
            >
              Método
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
