import type {
  CreateLandingPagePayload,
  LandingPageDraft,
  LandingPageTemplateCode,
} from "@/lib/lp/types";

type LandingPageTemplateDefaults = Omit<
  CreateLandingPagePayload,
  "status" | "projectData" | "renderedHtml" | "renderedCss"
>;

const templateDefaults: Record<
  LandingPageTemplateCode,
  LandingPageTemplateDefaults
> = {
  "lead-magnet": {
    name: "Checklist comercial",
    slug: "checklist-comercial",
    template: "lead-magnet",
    eyebrow: "Material gratuito",
    headline:
      "Receba o checklist que organiza sua operação comercial em 15 minutos",
    subheadline:
      "Capture leads com uma oferta simples, clara e acionável. Ideal para campanhas de Meta Ads e Google.",
    primaryCta: "Quero receber o checklist",
    secondaryCta: "Sem custo e com acesso imediato",
    captureTitle: "Deixe seu contato para liberar o material",
    captureDescription:
      "Preencha nome, email e WhatsApp para receber o checklist e seguir no fluxo de atendimento.",
    benefitsText:
      "Checklist pronto para uso\nChecklist de qualificação de leads\nRotina operacional para o time comercial",
    proofText:
      "Usado em campanhas de aquisição\nEntrega imediata apos cadastro\nFunciona para Meta Ads e landing pages",
  },
  diagnostic: {
    name: "Diagnostico express",
    slug: "diagnostico-express",
    template: "diagnostic",
    eyebrow: "Diagnostico",
    headline:
      "Descubra onde sua operação perde receita antes de escalar tráfego",
    subheadline:
      "Converta campanhas em conversas qualificadas com um diagnostico objetivo e uma devolutiva clara.",
    primaryCta: "Quero meu diagnostico",
    secondaryCta: "Leva menos de 3 minutos",
    captureTitle: "Receba o diagnostico no seu email e WhatsApp",
    captureDescription:
      "Capture o lead e continue o relacionamento no inbox com contexto para o time e para o agente.",
    benefitsText:
      "Perguntas objetivas\nResultado imediato\nAbertura natural para follow-up consultivo",
    proofText:
      "Ideal para surveys de performance\nConecta paid traffic ao inbox\nAjuda a priorizar leads com mais contexto",
  },
  spreadsheet: {
    name: "Planilha de metas",
    slug: "planilha-metas",
    template: "spreadsheet",
    eyebrow: "Planilha gratuita",
    headline:
      "Baixe a planilha que ajuda seu time a acompanhar metas e conversoes",
    subheadline:
      "Uma isca pratica para campanhas de topo e meio de funil, com valor percebido imediato.",
    primaryCta: "Baixar a planilha",
    secondaryCta: "Pronta para duplicar e usar",
    captureTitle: "Liberar planilha",
    captureDescription:
      "Use este bloco como captura simples com promessa clara de valor e entrega imediata.",
    benefitsText:
      "Organizacao semanal\nAcompanhamento de metas\nVisao simples de conversao",
    proofText:
      "Boa para campanhas frias\nAlta percepcao de valor\nFacil de adaptar para nichos diferentes",
  },
  webinar: {
    name: "Convite para aula",
    slug: "convite-aula",
    template: "webinar",
    eyebrow: "Aula gratuita",
    headline:
      "Participe da aula que mostra como transformar leads em conversas de alta intencao",
    subheadline:
      "Use esta LP para campanhas de aquecimento, aulas abertas e convites para eventos de conversao.",
    primaryCta: "Reservar minha vaga",
    secondaryCta: "Vagas limitadas",
    captureTitle: "Inscricao na aula",
    captureDescription:
      "Capture nome e contato para enviar lembretes, materiais complementares e iniciar o follow-up.",
    benefitsText:
      "Aula orientada a conversao\nEstrutura simples de captacao\nBoa para eventos e ofertas ao vivo",
    proofText:
      "Convite claro e objetivo\nBoa para remarketing\nPermite sequencia com isca e inbox",
  },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type LandingPageMarkupSeed = Pick<
  CreateLandingPagePayload,
  | "eyebrow"
  | "headline"
  | "subheadline"
  | "primaryCta"
  | "secondaryCta"
  | "captureTitle"
  | "captureDescription"
  | "benefitsText"
  | "proofText"
>;

export function buildLandingPageCreatePayload(
  template: LandingPageTemplateCode,
  tenantSlug: string,
  existingCount = 0,
): CreateLandingPagePayload {
  const base = templateDefaults[template];
  const sequence = existingCount > 0 ? `-${existingCount + 1}` : "";
  const name = `${base.name}${sequence ? ` ${existingCount + 1}` : ""}`;
  const slug = slugify(`${tenantSlug}-${base.slug}${sequence}`);
  const initialPayload = {
    ...base,
    name,
    slug,
    status: "draft" as const,
    projectData: null,
    renderedHtml: "",
    renderedCss: "",
  };

  return {
    ...initialPayload,
    renderedHtml: buildLandingPageInitialMarkup(initialPayload),
  };
}

export function buildLandingPageInitialMarkup(
  page: LandingPageMarkupSeed | LandingPageDraft,
): string {
  const benefits = page.benefitsText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(
      (item) =>
        `<li style="padding:12px 14px;border-radius:18px;background:rgba(136,98,255,.08);">${item}</li>`,
    )
    .join("");

  const proofs = page.proofText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(
      (item) =>
        `<li style="padding:12px 14px;border-radius:18px;background:rgba(17,17,26,.04);">${item}</li>`,
    )
    .join("");

  return `
    <section style="padding: 72px 24px; background: linear-gradient(180deg, rgba(136,98,255,.12) 0%, rgba(255,255,255,0) 100%);">
      <div style="max-width: 1120px; margin: 0 auto; display: grid; gap: 32px; align-items: start;">
        <div style="max-width: 760px;">
          <div data-gjs-type="text" style="display:inline-flex; padding:8px 14px; border-radius:999px; background:rgba(136,98,255,.08); font-size:12px; letter-spacing:.18em; text-transform:uppercase;">${page.eyebrow}</div>
          <h1 style="font-size:56px; line-height:1; margin:20px 0 0;">${page.headline}</h1>
          <p style="font-size:18px; line-height:1.7; color:rgba(17,17,26,.72); margin:20px 0 0; max-width: 720px;">${page.subheadline}</p>
          <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:28px;">
            <a href="#capture" style="display:inline-flex; align-items:center; justify-content:center; padding:14px 22px; border-radius:999px; background:#11111a; color:white; text-decoration:none; font-weight:600;">${page.primaryCta}</a>
            <a href="#proof" style="display:inline-flex; align-items:center; justify-content:center; padding:14px 22px; border-radius:999px; border:1px solid rgba(17,17,26,.12); color:#11111a; text-decoration:none; font-weight:600;">${page.secondaryCta}</a>
          </div>
        </div>
        <div id="capture" style="max-width: 540px; border:1px solid rgba(17,17,26,.08); background:white; border-radius:28px; padding:28px; box-shadow:0 20px 60px rgba(17,17,26,.08);">
          <h3 style="font-size:24px; margin:0;">${page.captureTitle}</h3>
          <p style="font-size:16px; line-height:1.7; color:rgba(17,17,26,.68); margin:12px 0 0;">${page.captureDescription}</p>
          <div style="display:grid; gap:12px; margin-top:20px;">
            <input placeholder="Seu nome" style="height:48px; border-radius:16px; border:1px solid rgba(17,17,26,.1); padding:0 14px;" />
            <input placeholder="Seu melhor email" style="height:48px; border-radius:16px; border:1px solid rgba(17,17,26,.1); padding:0 14px;" />
            <input placeholder="Seu WhatsApp" style="height:48px; border-radius:16px; border:1px solid rgba(17,17,26,.1); padding:0 14px;" />
            <button style="height:50px; border-radius:18px; border:none; background:#11111a; color:white; font-weight:600;">${page.primaryCta}</button>
          </div>
        </div>
      </div>
    </section>
    <section id="proof" style="padding: 0 24px 72px;">
      <div style="max-width:1120px; margin:0 auto; display:grid; gap:18px; grid-template-columns: repeat(2, minmax(0, 1fr));">
        <div style="border:1px solid rgba(17,17,26,.08); background:white; border-radius:28px; padding:28px;">
          <h3 style="font-size:22px; margin:0 0 18px;">O que a pessoa recebe</h3>
          <ul style="list-style:none; padding:0; margin:0; display:grid; gap:12px;">${benefits}</ul>
        </div>
        <div style="border:1px solid rgba(17,17,26,.08); background:white; border-radius:28px; padding:28px;">
          <h3 style="font-size:22px; margin:0 0 18px;">Argumentos de conversao</h3>
          <ul style="list-style:none; padding:0; margin:0; display:grid; gap:12px;">${proofs}</ul>
        </div>
      </div>
    </section>
  `;
}
