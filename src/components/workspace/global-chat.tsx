"use client";

import { MessageCircle, Search, SendHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getContacts } from "@/lib/contacts/api";
import type { ContactItem } from "@/lib/contacts/types";

type GlobalChatProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GlobalChat({ open, onOpenChange }: GlobalChatProps) {
  const [step, setStep] = useState<"contact" | "compose">("contact");
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadContacts = useCallback(async (query: string) => {
    setIsLoadingContacts(true);
    try {
      const data = await getContacts({
        search: query || undefined,
        limit: 20,
      });
      setContacts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar contatos.");
      setContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadContacts("");
      setStep("contact");
      setSelectedContact(null);
      setMessage("");
    }
  }, [open, loadContacts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadContacts(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadContacts]);

  const handleSelectContact = (contact: ContactItem) => {
    setSelectedContact(contact);
    setStep("compose");
  };

  const handleBackToContacts = () => {
    setSelectedContact(null);
    setStep("contact");
    setMessage("");
    searchInputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedContact) return;

    setIsSending(true);
    try {
      toast.success(`Mensagem enviada para ${selectedContact.name}!`);
      setMessage("");
      setSelectedContact(null);
      setStep("contact");
      onOpenChange(false);
    } catch {
      toast.error("Erro ao enviar mensagem.");
    } finally {
      setIsSending(false);
    }
  };

  const getContactDisplay = (contact: ContactItem) => {
    return contact.name || contact.email || contact.phone_number || "Sem nome";
  };

  const getContactSubtext = (contact: ContactItem) => {
    if (contact.phone_number) return contact.phone_number;
    if (contact.email) return contact.email;
    return contact.source;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md"
        showCloseButton={false}
      >
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="size-5 text-foreground" />
            <h2 className="font-medium text-foreground">Nova mensagem</h2>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {step === "contact" ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="border-b border-border/50 p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar contatos..."
                  className="h-12 rounded-xl pl-11"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingContacts ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "Nenhum contato encontrado"
                      : "Nenhum contato disponível"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {contacts.map((contact) => (
                    <button
                      type="button"
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-accent"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-sm font-medium text-foreground">
                        {getContactDisplay(contact).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {getContactDisplay(contact)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {getContactSubtext(contact)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border/50 px-5 py-3">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleBackToContacts}
              >
                <X className="size-4" />
              </Button>
              {selectedContact && (
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-medium text-foreground">
                    {getContactDisplay(selectedContact).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {getContactDisplay(selectedContact)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getContactSubtext(selectedContact)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground">
                Envie uma mensagem para{" "}
                <span className="font-medium text-foreground">
                  {selectedContact && getContactDisplay(selectedContact)}
                </span>
              </p>
            </div>

            <div className="border-t border-border/70 p-4">
              <div className="flex flex-col gap-3">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="min-h-24 resize-none rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => void handleSendMessage()}
                  disabled={!message.trim() || isSending}
                  className="self-end"
                >
                  <SendHorizontal className="size-4" />
                  {isSending ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

type GlobalChatFabProps = {
  onClick: () => void;
  unreadCount?: number;
};

export function GlobalChatFab({
  onClick,
  unreadCount = 0,
}: GlobalChatFabProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 size-14 rounded-full shadow-lg"
      size="icon"
    >
      <MessageCircle className="size-6" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Button>
  );
}
