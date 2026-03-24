export type LandingPageTemplateCode =
  | "lead-magnet"
  | "diagnostic"
  | "spreadsheet"
  | "webinar";

export type LandingPageStatus = "draft" | "published";

export type LandingPageProjectData = Record<string, unknown>;

export type LandingPageDraft = {
  id: string;
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
  projectData?: LandingPageProjectData | null;
  renderedHtml?: string;
  renderedCss?: string;
  updatedAt: string;
};
