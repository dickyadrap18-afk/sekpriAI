"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "@/components/toast";
import { MessageList } from "./message-list";
import { MessageDetail } from "./message-detail";
import { InboxToolbar } from "./inbox-toolbar";
import { ComposeSheet } from "./compose-sheet";
import { useInbox } from "../hooks/use-inbox";
import { useAccounts } from "../hooks/use-accounts";
import { useMessage } from "../hooks/use-message";
import type { ComposeFormData, ComposeMode, InboxFilters, Message } from "../types";
import { cn } from "@/lib/utils";

export function InboxView() {
  const searchParams = useSearchParams();

  // Folder comes from URL: /inbox?folder=starred
  const activeFolder = (searchParams.get("folder") ?? "inbox") as NonNullable<InboxFilters["folder"]>;

  const [filters, setFilters] = useState<InboxFilters>({});
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>("new");
  const [composePrefill, setComposePrefill] = useState<Partial<ComposeFormData>>({});

  // Merge URL folder into filters
  const activeFilters: InboxFilters = { ...filters, folder: activeFolder };

  const { messages, loading, error, refetch, total } = useInbox(activeFilters, page);
  const { accounts } = useAccounts();
  const { message: selectedMessage, loading: detailLoading, error: detailError } = useMessage(selectedId);

  function handleFiltersChange(f: InboxFilters) {
    // Keep folder from URL, only update search/label/priority/account
    setFilters({ ...f, folder: undefined });
    setPage(0);
  }

  // ── Actions ──

  const handleArchive = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase.from("messages").update({ is_archived: true }).eq("id", id);
    setSelectedId(null);
    refetch();
  }, [refetch]);

  const handleDelete = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase.from("messages").update({ is_deleted: true }).eq("id", id);
    setSelectedId(null);
    refetch();
  }, [refetch]);

  const handleStar = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data } = await supabase.from("messages").select("labels").eq("id", id).single();
    const current: string[] = data?.labels ?? [];
    const isStarred = current.includes("STARRED");
    const newLabels = isStarred
      ? current.filter((l: string) => l !== "STARRED")
      : [...current, "STARRED"];
    await supabase.from("messages").update({ labels: newLabels }).eq("id", id);
    refetch();
  }, [refetch]);

  const handleMarkRead = useCallback(async (id: string, read: boolean) => {
    const supabase = createClient();
    await supabase.from("messages").update({ is_read: read }).eq("id", id);
    refetch();
  }, [refetch]);

  const handleLabelToggle = useCallback(async (id: string, label: string) => {
    const supabase = createClient();
    const { data } = await supabase.from("messages").select("labels").eq("id", id).single();
    const current: string[] = data?.labels ?? [];
    const has = current.includes(label);
    const newLabels = has ? current.filter((l) => l !== label) : [...current, label];
    await supabase.from("messages").update({ labels: newLabels }).eq("id", id);
    refetch();
  }, [refetch]);

  const handleMoveTo = useCallback(async (id: string, folder: string) => {
    const supabase = createClient();
    if (folder === "archive") {
      await supabase.from("messages").update({ is_archived: true, is_deleted: false }).eq("id", id);
    } else if (folder === "trash") {
      await supabase.from("messages").update({ is_deleted: true }).eq("id", id);
    } else if (folder === "inbox") {
      await supabase.from("messages").update({ is_archived: false, is_deleted: false }).eq("id", id);
    } else if (folder === "important") {
      const { data } = await supabase.from("messages").select("labels").eq("id", id).single();
      const current: string[] = data?.labels ?? [];
      if (!current.includes("IMPORTANT")) {
        await supabase.from("messages").update({ labels: [...current, "IMPORTANT"] }).eq("id", id);
      }
    }
    showToast(`Moved to ${folder}`, "success");
    refetch();
  }, [refetch]);

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

  const handleSend = useCallback(async (data: ComposeFormData) => {
    const supabase = createClient();

    // Find the account to get email address
    const account = accounts.find((a) => a.id === data.from_account_id);
    if (!account) {
      showToast("No account selected", "error");
      return;
    }

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: data.from_account_id,
          to: data.to.split(",").map((e) => e.trim()).filter(Boolean),
          cc: data.cc ? data.cc.split(",").map((e) => e.trim()).filter(Boolean) : undefined,
          subject: data.subject,
          body_text: data.body,
          in_reply_to_message_id: data.in_reply_to_message_id,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        showToast(result.error || "Failed to send email", "error");
        return;
      }

      showToast("Email sent successfully", "success");
      setComposeOpen(false);

      // Delete draft if this was a draft being sent
      if (data.draft_id) {
        await supabase.from("messages").update({ is_deleted: true }).eq("id", data.draft_id);
      }

      refetch();
    } catch {
      showToast("Network error. Please try again.", "error");
    }
  }, [accounts, refetch]);

  const handleCompose = useCallback(() => {
    setComposeMode("new");
    setComposePrefill({});
    setComposeOpen(true);
  }, []);

  return (
    <div className="flex h-full">
      {/* Left panel: list */}
      <div className={cn(
        "flex flex-col border-r border-white/[0.06] w-full lg:w-80 lg:flex-shrink-0",
        selectedId && "hidden lg:flex"
      )}>
        <InboxToolbar
          filters={activeFilters}
          onFiltersChange={handleFiltersChange}
          accounts={accounts}
          onCompose={handleCompose}
        />

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <MessageList
            messages={messages}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
            error={error}
            total={total}
            page={page}
            onPageChange={setPage}
            onStar={handleStar}
            onMarkRead={handleMarkRead}
            onLabelToggle={handleLabelToggle}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onMoveTo={handleMoveTo}
          />
        </div>
      </div>

      {/* Right panel: detail */}
      <div className={cn("flex-1 flex flex-col", !selectedId && "hidden lg:flex")}>
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
          onMessageUpdate={() => refetch()}
        />
      </div>

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
