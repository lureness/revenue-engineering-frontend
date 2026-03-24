"use client";

import {
  BookUser,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createContact,
  deleteContact,
  getContacts,
  updateContact,
} from "@/lib/contacts/api";
import type { ContactItem } from "@/lib/contacts/types";
import { cn } from "@/lib/utils";

const sourceLabels = {
  manual: "Manual",
  import: "Importado",
  inbound: "Recebido",
  api: "API",
} as const;

function ContactForm({
  contact,
  onSubmit,
  onCancel,
  isLoading,
}: {
  contact?: ContactItem | null;
  onSubmit: (data: {
    name: string;
    email: string;
    phone_number: string;
  }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}) {
  const [name, setName] = useState(contact?.name ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone_number ?? "");

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setEmail(contact.email ?? "");
      setPhone(contact.phone_number ?? "");
    }
  }, [contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      email,
      phone_number: phone,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="contact-name">Nome</Label>
        <Input
          id="contact-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do contato"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact-email">E-mail</Label>
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact-phone">Telefone</Label>
        <Input
          id="contact-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+55 11 99999-9999"
        />
      </div>
      <DialogFooter>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : contact ? "Salvar" : "Criar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CreateContactDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    email: string;
    phone_number: string;
  }) => {
    setIsLoading(true);
    try {
      await createContact({
        name: data.name || null,
        email: data.email || null,
        phone_number: data.phone_number || null,
      });
      toast.success("Contato criado com sucesso.");
      setOpen(false);
      onCreated?.();
    } catch {
      toast.error("Erro ao criar contato.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Novo contato
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo contato</DialogTitle>
          <DialogDescription>
            Adicione um novo contato à sua base de clientes.
          </DialogDescription>
        </DialogHeader>
        <ContactForm
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditContactDialog({
  contact,
  onUpdated,
}: {
  contact: ContactItem;
  onUpdated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    email: string;
    phone_number: string;
  }) => {
    setIsLoading(true);
    try {
      await updateContact(contact.id, {
        name: data.name || null,
        email: data.email || null,
        phone_number: data.phone_number || null,
      });
      toast.success("Contato atualizado.");
      setOpen(false);
      onUpdated?.();
    } catch {
      toast.error("Erro ao atualizar contato.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <Pencil className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar contato</DialogTitle>
          <DialogDescription>
            Atualize as informações do contato.
          </DialogDescription>
        </DialogHeader>
        <ContactForm
          contact={contact}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}

function ContactRow({
  contact,
  onDeleted,
}: {
  contact: ContactItem;
  onDeleted?: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Excluir contato "${contact.name}"?`)) return;
    setIsDeleting(true);
    try {
      await deleteContact(contact.id);
      toast.success("Contato excluído.");
      onDeleted?.();
    } catch {
      toast.error("Erro ao excluir contato.");
    } finally {
      setIsDeleting(false);
    }
  };

  const displayName =
    contact.name || contact.email || contact.phone_number || "Sem nome";

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-sm font-medium text-foreground">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {displayName}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {contact.email && (
              <span className="flex items-center gap-1">
                <Mail className="size-3" />
                {contact.email}
              </span>
            )}
            {contact.phone_number && (
              <span className="flex items-center gap-1">
                <Phone className="size-3" />
                {contact.phone_number}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-[10px]">
          {sourceLabels[contact.source as keyof typeof sourceLabels] ??
            contact.source}
        </Badge>
        <EditContactDialog contact={contact} onUpdated={onDeleted} />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function ContactsView() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadContacts = useCallback(async (query: string = "") => {
    setIsLoading(true);
    try {
      const data = await getContacts({
        search: query || undefined,
        limit: 50,
      });
      setContacts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar contatos.");
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadContacts(searchQuery);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadContacts(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadContacts]);

  const contactsBySource = {
    manual: contacts.filter((c) => c.source === "manual").length,
    import: contacts.filter((c) => c.source === "import").length,
    inbound: contacts.filter((c) => c.source === "inbound").length,
    api: contacts.filter((c) => c.source === "api").length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card/85 shadow-sm">
              <CardContent className="grid gap-3 pt-5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="space-y-3 pt-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {contacts.length === 0
              ? "Nenhum contato"
              : `${contacts.length} contato${contacts.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <CreateContactDialog onCreated={() => void loadContacts(searchQuery)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="grid gap-3 pt-5">
            <Badge variant="secondary">Total</Badge>
            <p className="font-serif text-3xl tracking-tight text-foreground">
              {contacts.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="grid gap-3 pt-5">
            <Badge variant="outline">Manuais</Badge>
            <p className="font-serif text-3xl tracking-tight text-foreground">
              {contactsBySource.manual}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="grid gap-3 pt-5">
            <Badge variant="outline">Importados</Badge>
            <p className="font-serif text-3xl tracking-tight text-foreground">
              {contactsBySource.import}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="grid gap-3 pt-5">
            <Badge variant="outline">Inbound</Badge>
            <p className="font-serif text-3xl tracking-tight text-foreground">
              {contactsBySource.inbound}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/85 shadow-sm">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle>Contatos</CardTitle>
              <CardDescription>
                Gerencie sua base de contatos e clientes.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
            >
              <RefreshCcw
                className={cn("size-4", isRefreshing && "animate-spin")}
              />
            </Button>
          </div>

          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            )}
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone..."
              className="h-12 rounded-xl pl-11"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {contacts.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookUser className="size-4" />
                </EmptyMedia>
                <EmptyTitle>
                  {searchQuery
                    ? "Nenhum contato encontrado"
                    : "Nenhum contato cadastrado"}
                </EmptyTitle>
                <EmptyDescription>
                  {searchQuery
                    ? "Tente buscar com outros termos."
                    : "Adicione seu primeiro contato para começar."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  onDeleted={() => void loadContacts(searchQuery)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
