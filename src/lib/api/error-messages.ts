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
  "missing permission: tenant.surveys.read": {
    title: "Você não pode visualizar os surveys deste workspace.",
  },
  "missing permission: tenant.surveys.manage": {
    title: "Você não pode gerenciar os surveys deste workspace.",
  },
  "missing permission: tenant.landing_pages.read": {
    title: "Você não pode visualizar as landing pages deste workspace.",
  },
  "missing permission: tenant.landing_pages.manage": {
    title: "Você não pode gerenciar as landing pages deste workspace.",
  },
  "missing permission: tenant.conversations.read": {
    title: "Você não pode visualizar as conversas deste workspace.",
  },
  "missing permission: tenant.conversations.manage": {
    title: "Você não pode operar as conversas deste workspace.",
  },
  "missing permission: tenant.composer.send": {
    title:
      "Você não pode enviar mensagens a partir das conversas deste workspace.",
  },
  "missing permission: tenant.agents.read": {
    title: "Você não pode visualizar os agentes deste workspace.",
  },
  "missing permission: tenant.agents.manage": {
    title: "Você não pode gerenciar os agentes deste workspace.",
  },
  "missing permission: tenant.standard_messages.read": {
    title: "Você não pode visualizar as mensagens padrão deste workspace.",
  },
  "missing permission: tenant.standard_messages.manage": {
    title: "Você não pode gerenciar as mensagens padrão deste workspace.",
  },
  "missing permission: tenant.audit_logs.read": {
    title: "Você não pode visualizar os logs deste workspace.",
  },
  "missing permission: tenant.metrics.read": {
    title: "Você não pode visualizar métricas deste workspace.",
  },
  "provider account already exists for this tenant or account SID": {
    title: "Já existe uma conta de provedor Meta para este workspace.",
  },
  "provider account not found": {
    title: "A conta de provedor informada não foi encontrada.",
  },
  "whatsapp sender already exists for this phone number or sender": {
    title: "Já existe um sender do WhatsApp para esse número ou identificador.",
  },
  "whatsapp sender is already provisioned on twilio": {
    title: "Esse sender já foi provisionado na Meta.",
  },
  "whatsapp sender is not provisioned on twilio": {
    title: "Esse sender ainda não foi provisionado na Meta.",
  },
  "whatsapp sender not found": {
    title: "O sender do WhatsApp informado não foi encontrado.",
  },
  "profile_name is required to provision a twilio whatsapp sender": {
    title: "Informe um nome de perfil para provisionar o sender na Meta.",
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
  "survey template already exists for this workspace": {
    title: "O template IER já está instalado neste workspace.",
  },
  "typebot survey template already exists for this workspace": {
    title:
      "Já existe um survey Typebot com esse identificador neste workspace.",
  },
  "survey template not found": {
    title: "O survey informado não foi encontrado.",
  },
  "survey submission not found": {
    title: "Não encontramos a sessão deste diagnóstico.",
  },
  "invalid survey access token": {
    title: "O acesso a este diagnóstico expirou ou é inválido.",
  },
  "survey submission is already completed": {
    title: "Este diagnóstico já foi concluído.",
  },
  "question does not belong to this survey": {
    title: "A pergunta informada não pertence a este survey.",
  },
  "question option does not belong to this survey question": {
    title: "A opção escolhida não pertence a esta pergunta.",
  },
  "survey template has no questions": {
    title: "Este survey ainda não tem perguntas configuradas.",
  },
  "typebot-managed surveys do not use native submissions": {
    title: "Esse survey agora é executado pelo Typebot.",
    description:
      "Use a experiência pública Typebot em vez do fluxo nativo de submissão.",
  },
  "typebot api is not configured": {
    title: "A integracao com o Typebot ainda nao foi configurada.",
    description:
      "Preencha TYPEBOT_BUILDER_URL, TYPEBOT_API_TOKEN e TYPEBOT_WORKSPACE_ID antes de criar surveys automaticamente.",
  },
  "typebot api returned an invalid payload": {
    title: "O Typebot respondeu com um payload invalido.",
  },
  "landing page already exists for this workspace": {
    title: "Já existe uma landing page com esse slug neste workspace.",
  },
  "landing page not found": {
    title: "A landing page informada não foi encontrada.",
  },
  "survey submission is not complete": {
    title: "Responda todas as perguntas antes de gerar o diagnóstico.",
  },
  "survey result profile could not be resolved": {
    title: "Não foi possível calcular o diagnóstico agora.",
  },
  "survey submission must be completed before unlocking the report": {
    title: "Conclua o diagnóstico antes de desbloquear o relatório completo.",
  },
  "conversation not found": {
    title: "A conversa informada não foi encontrada.",
  },
  "conversation not found for tenant": {
    title: "A conversa informada não foi encontrada neste workspace.",
  },
  "assigned user not found in tenant": {
    title: "O usuário escolhido não pertence a este workspace.",
  },
  "assigned team not found in tenant": {
    title: "O time escolhido não pertence a este workspace.",
  },
  "message body is required": {
    title: "Escreva a mensagem antes de enviar.",
  },
  "contact does not have an email address": {
    title: "Esse contato não tem e-mail configurado.",
  },
  "contact does not have a phone number": {
    title: "Esse contato não tem telefone configurado.",
  },
  "unsupported conversation channel": {
    title: "Esse canal ainda não é compatível com o composer.",
  },
  "message log entry was not created": {
    title:
      "A mensagem foi enviada, mas o histórico não foi registrado corretamente.",
  },
  "message log entry was not found after sending": {
    title:
      "A mensagem foi enviada, mas não conseguimos localizar o registro dela no histórico.",
  },
  "standard message not found": {
    title: "A mensagem padrão informada não foi encontrada.",
  },
  "standard message code already exists in this workspace": {
    title: "Já existe uma mensagem padrão com esse código neste workspace.",
  },
  "unsupported standard message channel": {
    title: "O canal informado não é compatível com mensagens padrão.",
  },
  "standard message channel is not compatible with this conversation": {
    title: "Essa mensagem padrão não pode ser usada neste canal.",
  },
  "standard message body rendered empty": {
    title: "A mensagem padrão gerou um conteúdo vazio.",
  },
  "conversation does not have an active agent": {
    title: "Essa conversa ainda não tem um agente ativo.",
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
