export type SurveyTemplateConfiguration = Record<string, unknown> | null;

export type SurveyTemplateItem = {
  id: string;
  tenant_id: string;
  created_by_user_id: string | null;
  code: string;
  slug: string;
  name: string;
  description: string;
  configuration: SurveyTemplateConfiguration;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicSurveyQuestionOptionItem = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  display_order: number;
};

export type PublicSurveyQuestionItem = {
  id: string;
  code: string;
  pillar_name: string;
  title: string;
  description: string | null;
  display_order: number;
  options: PublicSurveyQuestionOptionItem[];
};

export type PublicSurveyTemplateItem = {
  id: string;
  tenant_slug: string;
  code: string;
  slug: string;
  name: string;
  description: string;
  configuration: SurveyTemplateConfiguration;
  questions: PublicSurveyQuestionItem[];
};

export type SurveySubmissionAnswerItem = {
  question_id: string;
  question_code: string;
  question_option_id: string;
  question_option_code: string;
};

export type SurveyResultProfileItem = {
  code: string;
  name: string;
  summary: string;
};

export type SurveyPillarResultItem = {
  question_id: string;
  question_code: string;
  pillar_name: string;
  question_title: string;
  score: number;
  max_score: number;
  percentage: number;
  selected_option_id: string;
  selected_option_code: string;
  selected_option_label: string;
};

export type SurveyGapItem = {
  pillar_name: string;
  question_title: string;
  description: string;
  percentage: number;
};

export type SurveyReportSectionItem = {
  code: string;
  title: string;
  description: string;
  locked: boolean;
};

export type SurveyResultCtaItem = {
  title: string;
  description: string;
  button_label: string;
};

export type SurveySubmissionResultItem = {
  total_score: number;
  max_score: number;
  percentage: number;
  profile: SurveyResultProfileItem;
  strongest_pillar: SurveyPillarResultItem;
  weakest_pillar: SurveyPillarResultItem;
  pillars: SurveyPillarResultItem[];
  identified_gaps: SurveyGapItem[];
  full_report_unlocked: boolean;
  report_sections: SurveyReportSectionItem[];
  cta: SurveyResultCtaItem | null;
};

export type PublicSurveySubmissionItem = {
  id: string;
  template_id: string;
  survey_slug: string;
  status: string;
  respondent_email: string;
  respondent_phone_number: string;
  respondent_name: string | null;
  company_name: string | null;
  annual_revenue_range: string | null;
  sales_team_size_range: string | null;
  answered_count: number;
  total_questions: number;
  progress_percentage: number;
  answers: SurveySubmissionAnswerItem[];
  completed_at: string | null;
  unlocked_at: string | null;
  result: SurveySubmissionResultItem | null;
};

export type StartSurveySubmissionResponse = PublicSurveySubmissionItem & {
  public_token: string;
};

export type StartSurveySubmissionPayload = {
  email: string;
  phone_number: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
};

export type SubmitSurveyAnswerPayload = {
  public_token: string;
  question_id: string;
  question_option_id: string;
};

export type CompleteSurveySubmissionPayload = {
  public_token: string;
};

export type UnlockSurveySubmissionPayload = {
  public_token: string;
  respondent_name: string;
  company_name: string;
  annual_revenue_range: string;
  sales_team_size_range: string;
};
