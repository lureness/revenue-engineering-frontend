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
  "team_slug already exists": {
    title: "Esse identificador de time já está em uso.",
  },
  "admin_email already exists": {
    title: "Esse e-mail já está em uso.",
  },
  "unable to create tenant bootstrap data": {
    title: "Não foi possível criar a conta inicial agora.",
  },
  "unable to create team": {
    title: "Não foi possível criar o time agora.",
  },
  "pending invite already exists for this email": {
    title: "Já existe um invite ativo para esse e-mail.",
  },
  "email already belongs to another tenant": {
    title: "Esse e-mail já pertence a outro tenant.",
  },
  "user already belongs to the team": {
    title: "Essa pessoa já faz parte do time.",
  },
  "invite is no longer active": {
    title: "Esse invite não está mais ativo.",
  },
  "team must have at least one admin": {
    title: "O time precisa manter pelo menos um admin.",
  },
  "team not found": {
    title: "O time informado não foi encontrado.",
  },
  "team member not found": {
    title: "O membro informado não foi encontrado.",
  },
  "tenant user not found": {
    title: "O usuário informado não foi encontrado neste workspace.",
  },
  "tenant permission already granted": {
    title: "Essa permissão já foi concedida para esse usuário.",
  },
  "tenant permission grant not found": {
    title: "Essa permissão direta já não estava atribuída.",
  },
  "tenant must have at least one owner": {
    title: "O workspace precisa manter pelo menos um owner.",
  },
  "missing permission: tenant.members.read": {
    title: "Você não pode visualizar os usuários deste workspace.",
  },
  "missing permission: tenant.members.manage": {
    title: "Você não pode alterar a role dos usuários deste workspace.",
  },
  "missing permission: tenant.permissions.manage": {
    title: "Você não pode gerenciar permissões neste workspace.",
  },
  "missing permission: tenant.provider_accounts.read": {
    title: "Você não pode visualizar contas de provedor neste workspace.",
  },
  "missing permission: tenant.provider_accounts.manage": {
    title: "Você não pode configurar contas de provedor neste workspace.",
  },
  "missing permission: tenant.whatsapp_senders.read": {
    title: "Você não pode visualizar senders do WhatsApp neste workspace.",
  },
  "missing permission: tenant.whatsapp_senders.manage": {
    title: "Você não pode gerenciar senders do WhatsApp neste workspace.",
  },
  "missing permission: tenant.messages.read": {
    title: "Você não pode visualizar o histórico de mensagens deste workspace.",
  },
  "missing permission: tenant.contacts.read": {
    title: "Você não pode visualizar os contatos deste workspace.",
  },
  "missing permission: tenant.contacts.manage": {
    title: "Você não pode gerenciar os contatos deste workspace.",
  },
  "missing permission: tenant.audit_logs.read": {
    title: "Você não pode visualizar os logs deste workspace.",
  },
  "missing permission: tenant.metrics.read": {
    title: "Você não pode visualizar métricas deste workspace.",
  },
  "provider account already exists for this tenant or account SID": {
    title: "Já existe uma conta de provedor Twilio para este workspace.",
  },
  "provider account not found": {
    title: "A conta de provedor informada não foi encontrada.",
  },
  "whatsapp sender already exists for this phone number or sender": {
    title: "Já existe um sender do WhatsApp para esse número ou identificador.",
  },
  "whatsapp sender is already provisioned on twilio": {
    title: "Esse sender já foi provisionado na Twilio.",
  },
  "whatsapp sender is not provisioned on twilio": {
    title: "Esse sender ainda não foi provisionado na Twilio.",
  },
  "whatsapp sender not found": {
    title: "O sender do WhatsApp informado não foi encontrado.",
  },
  "profile_name is required to provision a twilio whatsapp sender": {
    title: "Informe um nome de perfil para provisionar o sender na Twilio.",
  },
  "message not found": {
    title: "A mensagem informada não foi encontrada.",
  },
  "contact not found": {
    title: "O contato informado não foi encontrado.",
  },
  "contact already exists for this workspace": {
    title: "Já existe um contato neste workspace com esse e-mail ou telefone.",
  },
  "contact must include email or phone_number": {
    title: "Informe pelo menos um e-mail ou telefone para o contato.",
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
  "invalid or expired invite": {
    title: "O link de invite é inválido ou expirou.",
    description: "Peça um novo invite para entrar no time com um link válido.",
  },
  "invite email does not match the authenticated user": {
    title: "Você entrou com outra conta.",
    description:
      "Faça login com o mesmo e-mail que recebeu o invite para aceitar o acesso.",
  },
  "invite does not belong to the authenticated tenant": {
    title: "Esse invite não pertence à sua conta atual.",
    description: "Troque de conta para continuar com o e-mail convidado.",
  },
  "account already exists for invite email": {
    title: "Essa conta já existe.",
    description:
      "Entre com o e-mail convidado para aceitar o invite em vez de criar outra conta.",
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
