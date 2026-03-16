import { ApiClientError } from "@/lib/api/client";

type ApiErrorPresentation = {
  title: string;
  description?: string;
};

type ApiErrorFormatterOptions = {
  fallbackTitle?: string;
};

const DETAIL_MESSAGE_MAP: Record<string, ApiErrorPresentation> = {
  "invalid credentials": {
    title: "E-mail ou senha inválidos.",
  },
  "user is inactive": {
    title: "A sua conta está inativa.",
  },
  "email address is not verified": {
    title: "Verifique o seu e-mail antes de entrar.",
    description:
      "Se precisar, solicite um novo e-mail de verificação a partir desta tela.",
  },
  "invalid refresh token": {
    title: "A sua sessão não é mais válida.",
    description: "Faça login novamente para continuar.",
  },
  "refresh token expired": {
    title: "A sua sessão expirou.",
    description: "Entre novamente para continuar.",
  },
  "invalid access token": {
    title: "A sua sessão expirou.",
    description: "Entre novamente para continuar.",
  },
  "missing bearer token": {
    title: "Faça login para continuar.",
  },
  "tenant_slug already exists": {
    title: "Esse identificador de workspace já está em uso.",
  },
  "admin_email already exists": {
    title: "Esse e-mail já está em uso.",
  },
  "unable to create tenant bootstrap data": {
    title: "Não foi possível criar a conta inicial agora.",
  },
  "invalid current password": {
    title: "A senha atual informada está incorreta.",
  },
  "invalid or expired verification token": {
    title: "O link de verificação é inválido ou expirou.",
    description:
      "Se você pediu um novo e-mail, apenas o link mais recente continua válido.",
  },
  "invalid or expired reset token": {
    title: "O link de redefinição é inválido ou expirou.",
  },
};

function getErrorDetail(error: unknown) {
  if (error instanceof ApiClientError && typeof error.message === "string") {
    return error.message.trim().toLowerCase();
  }

  return null;
}

export function isApiErrorDetail(error: unknown, expectedDetail: string) {
  return getErrorDetail(error) === expectedDetail.trim().toLowerCase();
}

function getStatusFallback(status: number): ApiErrorPresentation {
  switch (status) {
    case 400:
      return {
        title: "Não foi possível concluir essa ação.",
        description: "Revise os dados informados e tente novamente.",
      };
    case 401:
      return {
        title: "Sua sessão não é válida.",
        description: "Faça login novamente para continuar.",
      };
    case 403:
      return {
        title: "Você não tem permissão para fazer isso.",
      };
    case 404:
      return {
        title: "O recurso solicitado não foi encontrado.",
      };
    case 409:
      return {
        title: "Já existe um conflito com os dados informados.",
      };
    case 422:
      return {
        title: "Os dados enviados são inválidos.",
        description: "Revise os campos e tente novamente.",
      };
    case 502:
    case 503:
      return {
        title: "O serviço externo não respondeu como esperado.",
        description: "Tente novamente em instantes.",
      };
    default:
      return {
        title: "Ocorreu um erro inesperado.",
        description: "Tente novamente em instantes.",
      };
  }
}

export function formatApiErrorMessage(
  error: unknown,
  options: ApiErrorFormatterOptions = {},
): ApiErrorPresentation {
  const detail = getErrorDetail(error);

  if (detail && detail in DETAIL_MESSAGE_MAP) {
    return DETAIL_MESSAGE_MAP[detail];
  }

  if (error instanceof ApiClientError) {
    return {
      ...getStatusFallback(error.status),
      title: options.fallbackTitle ?? getStatusFallback(error.status).title,
    };
  }

  return {
    title: options.fallbackTitle ?? "Não foi possível concluir a operação.",
  };
}
