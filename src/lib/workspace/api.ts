import { getContacts } from "@/lib/contacts/api";
import { getInboxConversations } from "@/lib/inbox/api";
import { getProviderAccounts, getWhatsAppSenders } from "@/lib/messaging/api";
import { getSurveyTemplates } from "@/lib/surveys/api";
import { getTeams } from "@/lib/teams/api";

export type WorkspaceDashboardData = {
  teamsCount: number;
  contactsCount: number;
  agentsCount: number;
  surveysCount: number;
  sendersCount: number;
  providerAccountsCount: number;
  conversationsCount: number;
};

export async function getWorkspaceDashboardData(): Promise<WorkspaceDashboardData> {
  const [teams, contacts, surveys, senders, providers, messages] =
    await Promise.allSettled([
      getTeams(),
      getContacts({ limit: 1 }),
      getSurveyTemplates(),
      getWhatsAppSenders(),
      getProviderAccounts(),
      getInboxConversations({ limit: 1, offset: 0 }),
    ]);

  const teamsCount = teams.status === "fulfilled" ? teams.value.length : 0;

  const contactsCount =
    contacts.status === "fulfilled"
      ? ((contacts.value as { total?: number; length?: number }).total ??
        contacts.value.length)
      : 0;

  const surveysCount =
    surveys.status === "fulfilled" ? surveys.value.length : 0;
  const sendersCount =
    senders.status === "fulfilled" ? senders.value.length : 0;
  const providerAccountsCount =
    providers.status === "fulfilled" ? providers.value.length : 0;

  const conversationsCount =
    messages.status === "fulfilled"
      ? ((messages.value as { total?: number; items?: unknown[] }).total ??
        messages.value.items?.length ??
        0)
      : 0;

  return {
    teamsCount,
    contactsCount,
    agentsCount: 0,
    surveysCount,
    sendersCount,
    providerAccountsCount,
    conversationsCount,
  };
}
