import { describe, expect, it } from "vitest";

import {
  buildPublicSurveyPath,
  buildPublicSurveyResumePath,
  buildPublicSurveyUrl,
  buildSurveyIframeSnippet,
  buildTypebotViewerUrl,
  getCurrentSurveyQuestion,
  getQuestionNumber,
  getSelectedOptionId,
} from "@/lib/surveys/utils";

const template = {
  id: "template-1",
  tenant_slug: "basix",
  code: "ier",
  slug: "indice-eficiencia-receita",
  name: "IER",
  description: "Desc",
  configuration: null,
  questions: [
    {
      id: "q1",
      code: "q1",
      pillar_name: "Pilar 1",
      title: "Pergunta 1",
      description: null,
      display_order: 1,
      options: [],
    },
    {
      id: "q2",
      code: "q2",
      pillar_name: "Pilar 2",
      title: "Pergunta 2",
      description: null,
      display_order: 2,
      options: [],
    },
  ],
};

describe("survey utils", () => {
  it("builds the public survey path", () => {
    expect(buildPublicSurveyPath("basix", "ier")).toBe("/surveys/basix/ier");
  });

  it("builds a resumable survey path", () => {
    expect(
      buildPublicSurveyResumePath({
        tenantSlug: "basix",
        surveySlug: "ier",
        submissionId: "sub-1",
        publicToken: "token-1",
      }),
    ).toBe("/surveys/basix/ier?submission=sub-1&token=token-1");
  });

  it("builds a public survey url with utm params", () => {
    expect(
      buildPublicSurveyUrl({
        origin: "https://app.lureness.com",
        tenantSlug: "basix",
        surveySlug: "ier",
        attribution: {
          utm_source: "meta",
          utm_medium: "paid-social",
          utm_campaign: "ier-q2",
          utm_content: "",
        },
      }),
    ).toBe(
      "https://app.lureness.com/surveys/basix/ier?utm_source=meta&utm_medium=paid-social&utm_campaign=ier-q2",
    );
  });

  it("builds an iframe snippet", () => {
    expect(
      buildSurveyIframeSnippet({
        publicUrl: "https://app.lureness.com/surveys/basix/ier",
        title: "IER Basix",
        height: 1200,
      }),
    ).toContain('src="https://app.lureness.com/surveys/basix/ier"');
  });

  it("builds a typebot viewer url with forwarded params", () => {
    const params = new URLSearchParams({
      utm_source: "meta",
      utm_campaign: "diagnostico-q2",
    });

    expect(
      buildTypebotViewerUrl({
        publicUrl: "https://bot.lureness.com/public-id",
        searchParams: params,
      }),
    ).toBe(
      "https://bot.lureness.com/public-id?utm_source=meta&utm_campaign=diagnostico-q2",
    );
  });

  it("returns the first unanswered question", () => {
    const submission = {
      answers: [
        {
          question_id: "q1",
          question_code: "q1",
          question_option_id: "opt-1",
          question_option_code: "A",
        },
      ],
    };

    expect(
      getCurrentSurveyQuestion(template as never, submission as never)?.id,
    ).toBe("q2");
  });

  it("returns the last question when everything is answered", () => {
    const submission = {
      answers: [
        {
          question_id: "q1",
          question_code: "q1",
          question_option_id: "opt-1",
          question_option_code: "A",
        },
        {
          question_id: "q2",
          question_code: "q2",
          question_option_id: "opt-2",
          question_option_code: "B",
        },
      ],
    };

    const currentQuestion = getCurrentSurveyQuestion(
      template as never,
      submission as never,
    );

    expect(currentQuestion?.id).toBe("q2");
    expect(getQuestionNumber(template as never, currentQuestion as never)).toBe(
      2,
    );
  });

  it("returns the selected option id for a question", () => {
    const submission = {
      answers: [
        {
          question_id: "q1",
          question_code: "q1",
          question_option_id: "opt-1",
          question_option_code: "A",
        },
      ],
    };

    expect(getSelectedOptionId(submission as never, "q1")).toBe("opt-1");
    expect(getSelectedOptionId(submission as never, "q2")).toBeNull();
  });
});
