"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "@/components/toast";
import { MessageList } from "./message-list";
import { MessageDetail } from "./message-detail";
import { AccountSwitcher } from "./account-switcher";
import { SearchBar } from "./search-bar";
import { ComposeSheet } from "./compose-sheet";
import { useInbox } from "../hooks/use-inbox";
import { useAccounts } from "../hooks/use-accounts";
import { useMessage } from "../hooks/use-message";
import type { ComposeFormData, ComposeMode, InboxFilters, Message } from "../types";
import { cn } from "@/lib/utils";

export function InboxView() {
  const [filters, setFilters] = useState<InboxFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>("new");
  const [composePrefill, setComposePrefill] = useState<Partial<ComposeFormData>>({});

  const { messages, loading, error, refetch } = useInbox(filters);
  const { accounts } = useAccounts();
  const { message: selectedMessage, loading: detailLoading, error: detailError } =
    useMessage(selectedId);

  // Actions
  const handleArchive = useCallback(
    async (id: string) => {
      const supabase = createClient();
      await supabase.from("messages").update({ is_archived: true }).eq("id", id);
      setSelectedId(null);
      refetch();
    },
    [refetch]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const supabase = createClient();
      await supabase.from("messages").update({ is_deleted: true }).eq("id", id);
      setSelectedId(null);
      refetch();
    },
    [refetch]
  );

  const handleReply = useCallback((msg: Message) => {
    setComposeMode("reply");
    setComposePrefill({
      to: msg.from_email,
      subject: `Re: ${msg.subject || ""}`,
      in_reply_to_message_id: msg.id,
      body: `\n\n---\nOn ${msg.received_at ? new Date(msg.received_at).toLocaleString() : ""}, ${msg.from_name || msg.from_email} wrote:\n> ${msg.body_text?.split("\n").join("\n> ") || ""}`,
    });
    setComposeOpen(true);
  }, []);

  const handleForward = useCallback((msg: Message) => {
    setComposeMode("forward");
    setComposePrefill({
      subject: `Fwd: ${msg.subject || ""}`,
      body: `\n\n---\nForwarded message:\nFrom: ${msg.from_name || msg.from_email} <${msg.from_email}>\nSubject: ${msg.subject || ""}\n\n${msg.body_text || ""}`,
    });
    setComposeOpen(true);
  }, []);

  const handleSend = useCallback(
    async (_data: ComposeFormData) => {
      // Phase 4 will implement actual sending via provider adapters.
      showToast(
        "Send requires explicit approval. Provider integration handles actual delivery.",
        "info"
      );
      setComposeOpen(false);
    },
    []
  );

  const handleCompose = useCallback(() => {
    setComposeMode("new");
    setComposePrefill({});
    setComposeOpen(true);
  }, []);

  return (
    <div className="flex h-full">
      {/* Left panel: list */}
      <div
        className={cn(
          "flex flex-col border-r w-full lg:w-96 lg:flex-shrink-0",
          selectedId && "hidden lg:flex"
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <SearchBar
            value={filters.search || ""}
            onChange={(search) => setFilters({ ...filters, search: search || undefined })}
          />
          <AccountSwitcher
            accounts={accounts}
            selectedId={filters.account_id}
            onSelect={(id) => setFilters({ ...filters, account_id: id })}
          />
          <button
            onClick={handleCompose}
            className="flex-shrink-0 rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary/90"
            aria-label="Compose new message"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
            error={error}
          />
        </div>
      </div>

      {/* Right panel: detail */}
      <div
        className={cn(
          "flex-1 flex flex-col",
          !selectedId && "hidden lg:flex"
        )}
      >
        <MessageDetail
          message={selectedMessage}
          loading={detailLoading}
          error={detailError}
          accounts={accounts}
          onBack={() => setSelectedId(null)}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onReply={handleReply}
          onForward={handleForward}
          onSend={handleSend}
        />
      </div>

      {/* Compose sheet */}
      <ComposeSheet
        open={composeOpen}
        mode={composeMode}
        accounts={accounts}
        prefill={composePrefill}
        onClose={() => setComposeOpen(false)}
        onSend={handleSend}
      />
    </div>
  );
}
