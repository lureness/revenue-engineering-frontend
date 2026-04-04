import { apiRequest } from "@/lib/api/client";
import type {
  CreateLandingPagePayload,
  LandingPageFilters,
  LandingPageItem,
  PublicLandingPageItem,
  UpdateLandingPagePayload,
} from "@/lib/lp/types";

type LandingPageItemApi = {
  id: string;
  tenant_id: string;
  created_by_user_id: string | null;
  name: string;
  slug: string;
  template: LandingPageItem["template"];
  status: LandingPageItem["status"];
  eyebrow: string;
  headline: string;
  subheadline: string;
  primary_cta: string;
  secondary_cta: string;
  capture_title: string;
  capture_description: string;
  benefits_text: string;
  proof_text: string;
  project_data: LandingPageItem["projectData"];
  rendered_html: string;
  rendered_css: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type PublicLandingPageItemApi = Omit<
  LandingPageItemApi,
  "created_by_user_id" | "created_at"
> & {
  tenant_slug: string;
  tenant_name: string;
};

function toLandingPageItem(item: LandingPageItemApi): LandingPageItem {
  return {
    id: item.id,
    tenantId: item.tenant_id,
    createdByUserId: item.created_by_user_id,
    name: item.name,
    slug: item.slug,
    template: item.template,
    status: item.status,
    eyebrow: item.eyebrow,
    headline: item.headline,
    subheadline: item.subheadline,
    primaryCta: item.primary_cta,
    secondaryCta: item.secondary_cta,
    captureTitle: item.capture_title,
    captureDescription: item.capture_description,
    benefitsText: item.benefits_text,
    proofText: item.proof_text,
    projectData: item.project_data,
    renderedHtml: item.rendered_html,
    renderedCss: item.rendered_css,
    publishedAt: item.published_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function toPublicLandingPageItem(
  item: PublicLandingPageItemApi,
): PublicLandingPageItem {
  return {
    ...toLandingPageItem({
      ...item,
      created_by_user_id: null,
      created_at: item.updated_at,
    }),
    tenantSlug: item.tenant_slug,
    tenantName: item.tenant_name,
  };
}

function stripUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as Partial<T>;
}

function toLandingPagePayload(
  payload: CreateLandingPagePayload | UpdateLandingPagePayload,
) {
  return stripUndefined({
    name: payload.name,
    slug: payload.slug,
    template: payload.template,
    status: payload.status,
    eyebrow: payload.eyebrow,
    headline: payload.headline,
    subheadline: payload.subheadline,
    primary_cta: payload.primaryCta,
    secondary_cta: payload.secondaryCta,
    capture_title: payload.captureTitle,
    capture_description: payload.captureDescription,
    benefits_text: payload.benefitsText,
    proof_text: payload.proofText,
    project_data: payload.projectData,
    rendered_html: payload.renderedHtml,
    rendered_css: payload.renderedCss,
  });
}

export async function getLandingPages(filters: LandingPageFilters = {}) {
  const response = await apiRequest<LandingPageItemApi[]>("/landing-pages", {
    method: "GET",
    query: filters,
    cache: "no-store",
  });

  return response.map(toLandingPageItem);
}

export async function getLandingPage(landingPageId: string) {
  const response = await apiRequest<LandingPageItemApi>(
    `/landing-pages/${landingPageId}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  return toLandingPageItem(response);
}

export async function createLandingPage(payload: CreateLandingPagePayload) {
  const response = await apiRequest<LandingPageItemApi>("/landing-pages", {
    method: "POST",
    body: toLandingPagePayload(payload),
    cache: "no-store",
  });

  return toLandingPageItem(response);
}

export async function updateLandingPage(
  landingPageId: string,
  payload: UpdateLandingPagePayload,
) {
  const response = await apiRequest<LandingPageItemApi>(
    `/landing-pages/${landingPageId}`,
    {
      method: "PATCH",
      body: toLandingPagePayload(payload),
      cache: "no-store",
    },
  );

  return toLandingPageItem(response);
}

export async function deleteLandingPage(landingPageId: string) {
  return apiRequest<void>(`/landing-pages/${landingPageId}`, {
    method: "DELETE",
    cache: "no-store",
  });
}

export async function getPublicLandingPage(
  tenantSlug: string,
  landingPageSlug: string,
) {
  const response = await apiRequest<PublicLandingPageItemApi>(
    `/landing-pages/public/${tenantSlug}/${landingPageSlug}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  return toPublicLandingPageItem(response);
}
