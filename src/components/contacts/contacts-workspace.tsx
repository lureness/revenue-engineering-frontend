"use client";

import {
  BookUser,
  Loader2,
  Mail,
  PencilLine,
  Phone,
  Search,
  UserRoundPlus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAccess } from "@/components/access/access-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import { createContact, getContacts, updateContact } from "@/lib/contacts/api";
import type {
  ContactItem,
  ContactSource,
  CreateContactPayload,
  UpdateContactPayload,
} from "@/lib/contacts/types";
import {
  getContactSourceLabel,
  hasReachableContactChannel,
} from "@/lib/contacts/utils";
import { formatDateTime } from "@/lib/observability/format";
import {
  TENANT_CONTACTS_MANAGE_PERMISSION,
  TENANT_CONTACTS_READ_PERMISSION,
} from "@/lib/rbac/permissions";

const CONTACT_SOURCE_OPTIONS: Array<{
  label: string;
  value: ContactSource;
}> = [
  { label: "Manual", value: "manual" },
  { label: "Importação", value: "import" },
  { label: "Inbound", value: "inbound" },
  { label: "API", value: "api" },
];

type ContactFormState = {
  name: string;
  email: string;
  phone_number: string;
  source: ContactSource;
};

const INITIAL_CREATE_FORM: ContactFormState = {
  name: "",
  email: "",
  phone_number: "",
  source: "manual",
};

function buildCreatePayload(form: ContactFormState): CreateContactPayload {
  return {
    name: form.name.trim() || null,
    email: form.email.trim() || null,
    phone_number: form.phone_number.trim() || null,
    source: form.source,
  };
}

function buildUpdatePayload(form: ContactFormState): UpdateContactPayload {
  return {
    name: form.name.trim() || null,
    email: form.email.trim() || null,
    phone_number: form.phone_number.trim() || null,
    source: form.source,
  };
}

function getContactFormState(contact: ContactItem): ContactFormState {
  return {
    name: contact.name,
    email: contact.email ?? "",
    phone_number: contact.phone_number ?? "",
    source: contact.source,
  };
}

export function ContactsWorkspace() {
  const { hasTenantPermission, status: accessStatus } = useAccess();

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);
  const [createForm, setCreateForm] =
    useState<ContactFormState>(INITIAL_CREATE_FORM);
  const [editForm, setEditForm] = useState<ContactFormState | null>(null);

  const canReadContacts = hasTenantPermission(TENANT_CONTACTS_READ_PERMISSION);
  const canManageContacts = hasTenantPermission(
    TENANT_CONTACTS_MANAGE_PERMISSION,
  );
  const canAccessContacts = canReadContacts || canManageContacts;
  const selectedContact =
    contacts.find((contact) => contact.id === selectedContactId) ?? null;
  const totalWithEmail = useMemo(
    () => contacts.filter((contact) => Boolean(contact.email)).length,
    [contacts],
  );
  const totalWithPhone = useMemo(
    () => contacts.filter((contact) => Boolean(contact.phone_number)).length,
    [contacts],
  );

  const loadContacts = useCallback(
    async (
      nextSearchQuery = searchQuery,
      preferredContactId?: string | null,
    ) => {
      if (!canReadContacts) {
        setContacts([]);
        setSelectedContactId(null);
        setWorkspaceError(null);
        setIsLoadingContacts(false);
        return;
      }

      setIsLoadingContacts(true);
      setWorkspaceError(null);

      try {
        const nextContacts = await getContacts({
          search: nextSearchQuery,
          limit: 100,
        });

        setContacts(nextContacts);
        setSelectedContactId((currentValue) => {
          if (
            preferredContactId &&
            nextContacts.some((contact) => contact.id === preferredContactId)
          ) {
            return preferredContactId;
          }

          if (
            currentValue &&
            nextContacts.some((contact) => contact.id === currentValue)
          ) {
            return currentValue;
          }

          return nextContacts[0]?.id ?? null;
        });
      } catch (error) {
        const presentation = formatApiErrorMessage(error, {
          fallbackTitle: "Não foi possível carregar os contatos agora.",
        });
        setWorkspaceError(presentation.title);
        setContacts([]);
        setSelectedContactId(null);
      } finally {
        setIsLoadingContacts(false);
      }
    },
    [canReadContacts, searchQuery],
  );

  useEffect(() => {
    if (accessStatus === "loading") {
      return;
    }

    void loadContacts();
  }, [accessStatus, loadContacts]);

  useEffect(() => {
    if (!selectedContact) {
      setEditForm(null);
      return;
    }

    setEditForm(getContactFormState(selectedContact));
  }, [selectedContact]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSearchQuery = searchInput.trim();
    setSearchQuery(nextSearchQuery);
    void loadContacts(nextSearchQuery);
  }

  function handleSearchReset() {
    setSearchInput("");
    setSearchQuery("");
    void loadContacts("", selectedContactId);
  }

  async function handleCreateContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !hasReachableContactChannel(createForm.email, createForm.phone_number)
    ) {
      toast.error(
        "Informe pelo menos um canal de contato: e-mail ou telefone.",
      );
      return;
    }

    setIsCreatingContact(true);

    try {
      const createdContact = await createContact(
        buildCreatePayload(createForm),
      );
      setCreateForm(INITIAL_CREATE_FORM);

      if (canReadContacts) {
        await loadContacts(searchQuery, createdContact.id);
      } else {
        setContacts([createdContact]);
        setSelectedContactId(createdContact.id);
      }

      toast.success("Contato criado com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível criar o contato agora.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsCreatingContact(false);
    }
  }

  async function handleUpdateContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedContact || !editForm) {
      return;
    }

    if (!hasReachableContactChannel(editForm.email, editForm.phone_number)) {
      toast.error(
        "Informe pelo menos um canal de contato: e-mail ou telefone.",
      );
      return;
    }

    setIsUpdatingContact(true);

    try {
      const updatedContact = await updateContact(
        selectedContact.id,
        buildUpdatePayload(editForm),
      );

      setContacts((currentContacts) =>
        currentContacts.map((contact) =>
          contact.id === updatedContact.id ? updatedContact : contact,
        ),
      );
      setSelectedContactId(updatedContact.id);
      setEditForm(getContactFormState(updatedContact));
      toast.success("Contato atualizado com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível atualizar o contato agora.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsUpdatingContact(false);
    }
  }

  if (accessStatus === "loading") {
    return (
      <Card className="bg-card/85 shadow-sm">
        <CardContent className="flex min-h-72 items-center justify-center pt-6">
          <div className="inline-flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando contatos do workspace...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canAccessContacts) {
    return (
      <Empty className="rounded-[2rem] border border-dashed border-border/70 bg-card/80 py-16 shadow-sm">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookUser className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Contatos indisponíveis para o seu acesso</EmptyTitle>
          <EmptyDescription>
            Você precisa de permissão para visualizar ou gerenciar os contatos
            deste workspace.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.9fr)]">
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/85 shadow-sm md:col-span-2">
            <CardContent className="grid gap-3 pt-5">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="secondary">Base de contatos</Badge>
                <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background">
                  <BookUser className="size-4" />
                </span>
              </div>
              <div className="space-y-2">
                <p className="font-serif text-4xl tracking-tight text-foreground">
                  {contacts.length}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Pessoas disponíveis para os próximos fluxos de conversa, inbox
                  e CRM.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/85 shadow-sm">
            <CardContent className="grid gap-3 pt-5">
              <Badge variant="outline">Canais ativos</Badge>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {totalWithPhone} com telefone • {totalWithEmail} com e-mail
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Os contatos já entram preparados para se ligar ao histórico de
                  mensagens.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/85 shadow-sm">
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <CardTitle>Contatos do workspace</CardTitle>
                <CardDescription>
                  Pesquise, selecione e refine a base que vai alimentar as
                  próximas conversas.
                </CardDescription>
              </div>
              <Badge variant="outline">
                {searchQuery ? `Filtro: ${searchQuery}` : "Sem filtros"}
              </Badge>
            </div>
            <form
              className="flex flex-col gap-3 md:flex-row"
              onSubmit={handleSearchSubmit}
            >
              <div className="flex-1">
                <Field>
                  <FieldLabel htmlFor="contacts-search">Busca</FieldLabel>
                  <FieldContent>
                    <Input
                      id="contacts-search"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Busque por nome, e-mail ou telefone"
                    />
                  </FieldContent>
                </Field>
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" variant="outline">
                  <Search className="size-4" />
                  Buscar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSearchReset}
                  disabled={!searchInput && !searchQuery}
                >
                  Limpar
                </Button>
              </div>
            </form>
          </CardHeader>
          <CardContent className="grid gap-4">
            {workspaceError ? (
              <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {workspaceError}
              </div>
            ) : null}

            {isLoadingContacts ? (
              <div className="flex min-h-60 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Carregando contatos...
              </div>
            ) : contacts.length === 0 ? (
              <Empty className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/80 py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookUser className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum contato encontrado</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery
                      ? "Ajuste a busca ou limpe o filtro para revisar toda a base."
                      : "Crie o primeiro contato do workspace para começar a estruturar as conversas."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Atualizado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => {
                    const isSelected = contact.id === selectedContactId;

                    return (
                      <TableRow
                        key={contact.id}
                        data-state={isSelected ? "selected" : undefined}
                        className="cursor-pointer"
                        onClick={() => setSelectedContactId(contact.id)}
                      >
                        <TableCell className="max-w-[18rem]">
                          <div className="min-w-0 space-y-1">
                            <p className="truncate font-medium text-foreground">
                              {contact.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {contact.email ?? "Sem e-mail"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {contact.phone_number ?? "Sem telefone"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getContactSourceLabel(contact.source)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(contact.updated_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {canManageContacts ? (
          <Card className="bg-card/85 shadow-sm">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background">
                  <UserRoundPlus className="size-4" />
                </span>
                <div>
                  <CardTitle>Novo contato</CardTitle>
                  <CardDescription>
                    Adicione pessoas à base do workspace com um canal de alcance
                    válido.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleCreateContact}>
                <Field>
                  <FieldLabel htmlFor="create-contact-name">Nome</FieldLabel>
                  <FieldContent>
                    <Input
                      id="create-contact-name"
                      value={createForm.name}
                      onChange={(event) =>
                        setCreateForm((currentValue) => ({
                          ...currentValue,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nome da pessoa ou empresa"
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel htmlFor="create-contact-email">E-mail</FieldLabel>
                  <FieldContent>
                    <Input
                      id="create-contact-email"
                      type="email"
                      value={createForm.email}
                      onChange={(event) =>
                        setCreateForm((currentValue) => ({
                          ...currentValue,
                          email: event.target.value,
                        }))
                      }
                      placeholder="contato@empresa.com"
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel htmlFor="create-contact-phone">
                    Telefone
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="create-contact-phone"
                      type="tel"
                      value={createForm.phone_number}
                      onChange={(event) =>
                        setCreateForm((currentValue) => ({
                          ...currentValue,
                          phone_number: event.target.value,
                        }))
                      }
                      placeholder="+55 11 99999-9999"
                    />
                  </FieldContent>
                  <FieldDescription>
                    Você precisa informar e-mail ou telefone.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="create-contact-source">
                    Origem
                  </FieldLabel>
                  <FieldContent>
                    <Select
                      value={createForm.source}
                      onValueChange={(value) =>
                        setCreateForm((currentValue) => ({
                          ...currentValue,
                          source: value as ContactSource,
                        }))
                      }
                    >
                      <SelectTrigger
                        id="create-contact-source"
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_SOURCE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
                <Button type="submit" disabled={isCreatingContact}>
                  {isCreatingContact ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserRoundPlus className="size-4" />
                  )}
                  {isCreatingContact ? "Criando..." : "Criar contato"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <Card className="bg-card/85 shadow-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background">
                <PencilLine className="size-4" />
              </span>
              <div>
                <CardTitle>Contato selecionado</CardTitle>
                <CardDescription>
                  Revise os dados principais e ajuste a base conforme o
                  workspace evolui.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedContact || !editForm ? (
              <Empty className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/80 py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookUser className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Selecione um contato</EmptyTitle>
                  <EmptyDescription>
                    Escolha um item da lista para revisar ou editar os dados.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <form className="grid gap-4" onSubmit={handleUpdateContact}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {getContactSourceLabel(selectedContact.source)}
                  </Badge>
                  <Badge variant="outline">
                    Criado em {formatDateTime(selectedContact.created_at)}
                  </Badge>
                  <Badge variant="outline">
                    Atualizado em {formatDateTime(selectedContact.updated_at)}
                  </Badge>
                </div>
                <Field>
                  <FieldLabel htmlFor="edit-contact-name">Nome</FieldLabel>
                  <FieldContent>
                    <Input
                      id="edit-contact-name"
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm((currentValue) =>
                          currentValue
                            ? {
                                ...currentValue,
                                name: event.target.value,
                              }
                            : currentValue,
                        )
                      }
                      disabled={!canManageContacts}
                    />
                  </FieldContent>
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="edit-contact-email">E-mail</FieldLabel>
                    <FieldContent>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="edit-contact-email"
                          type="email"
                          className="pl-9"
                          value={editForm.email}
                          onChange={(event) =>
                            setEditForm((currentValue) =>
                              currentValue
                                ? {
                                    ...currentValue,
                                    email: event.target.value,
                                  }
                                : currentValue,
                            )
                          }
                          disabled={!canManageContacts}
                        />
                      </div>
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="edit-contact-phone">
                      Telefone
                    </FieldLabel>
                    <FieldContent>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="edit-contact-phone"
                          type="tel"
                          className="pl-9"
                          value={editForm.phone_number}
                          onChange={(event) =>
                            setEditForm((currentValue) =>
                              currentValue
                                ? {
                                    ...currentValue,
                                    phone_number: event.target.value,
                                  }
                                : currentValue,
                            )
                          }
                          disabled={!canManageContacts}
                        />
                      </div>
                    </FieldContent>
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="edit-contact-source">Origem</FieldLabel>
                  <FieldContent>
                    <Select
                      value={editForm.source}
                      onValueChange={(value) =>
                        setEditForm((currentValue) =>
                          currentValue
                            ? {
                                ...currentValue,
                                source: value as ContactSource,
                              }
                            : currentValue,
                        )
                      }
                      disabled={!canManageContacts}
                    >
                      <SelectTrigger
                        id="edit-contact-source"
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_SOURCE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
                {canManageContacts ? (
                  <Button type="submit" disabled={isUpdatingContact}>
                    {isUpdatingContact ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <PencilLine className="size-4" />
                    )}
                    {isUpdatingContact ? "Salvando..." : "Salvar alterações"}
                  </Button>
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Você pode visualizar o contato, mas não tem permissão para
                    editar esta base.
                  </p>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
