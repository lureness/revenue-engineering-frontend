export type LandingPageTemplateCode =
  | "lead-magnet"
  | "diagnostic"
  | "spreadsheet"
  | "webinar";

export type LandingPageStatus = "draft" | "published";

export type LandingPageProjectData = Record<string, unknown>;

export type LandingPageItem = {
  id: string;
  tenantId: string;
  createdByUserId: string | null;
  name: string;
  slug: string;
  template: LandingPageTemplateCode;
  status: LandingPageStatus;
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  captureTitle: string;
  captureDescription: string;
  benefitsText: string;
  proofText: string;
  projectData: LandingPageProjectData | null;
  renderedHtml: string;
  renderedCss: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LandingPageDraft = LandingPageItem;

export type LandingPageFilters = {
  search?: string;
  status?: LandingPageStatus;
  limit?: number;
};

export type CreateLandingPagePayload = {
  name: string;
  slug: string;
  template: LandingPageTemplateCode;
  status: LandingPageStatus;
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  captureTitle: string;
  captureDescription: string;
  benefitsText: string;
  proofText: string;
  projectData: LandingPageProjectData | null;
  renderedHtml: string;
  renderedCss: string;
};

export type UpdateLandingPagePayload = Partial<CreateLandingPagePayload>;

export type PublicLandingPageItem = Omit<
  LandingPageItem,
  "createdByUserId" | "createdAt"
> & {
  tenantSlug: string;
  tenantName: string;
};
