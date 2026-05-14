"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox, BookMarked, MessageSquare, Settings,
  Menu, X, LogOut,
  Star, AlertCircle, Send, FileText, Archive, Trash2,
  ChevronDown,
} from "lucide-react";
import { signOut } from "@/app/(app)/actions";
import { AmbientBg } from "@/components/ambient-bg";

interface AppShellProps {
  user: User;
  children: React.ReactNode;
}

const EMAIL_FOLDERS = [
  { folder: "inbox",     label: "Inbox",     icon: Inbox },
  { folder: "starred",   label: "Starred",   icon: Star },
  { folder: "important", label: "Important", icon: AlertCircle },
  { folder: "sent",      label: "Sent",      icon: Send },
  { folder: "drafts",    label: "Drafts",    icon: FileText },
  { folder: "archive",   label: "Archive",   icon: Archive },
  { folder: "trash",     label: "Trash",     icon: Trash2 },
] as const;

const TOP_NAV = [
  { href: "/memory",   label: "AI Memory", icon: BookMarked },
  { href: "/channels", label: "Channels",  icon: MessageSquare },
  { href: "/settings", label: "Settings",  icon: Settings },
];

const FULL_HEIGHT_ROUTES = ["/inbox"];

export function AppShell({ user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFullHeight = FULL_HEIGHT_ROUTES.some((r) => pathname.startsWith(r));

  const activeFolder = searchParams.get("folder") ?? "inbox";
  const isInboxSection = pathname.startsWith("/inbox");

  return (
    <div className="flex h-screen overflow-hidden text-white" style={{ background: "#080810" }}>

      {/* ── Ambient background ── */}
      <AmbientBg />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col",
          "transition-transform duration-200 ease-out",
          "lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "rgba(8,8,16,0.85)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(201,169,110,0.08)",
        }}
      >
        {/* Logo */}
        <div className="flex h-24 items-center justify-between px-4"
          style={{ borderBottom: "1px solid rgba(201,169,110,0.07)" }}>
          <Link href="/inbox" className="flex items-center" onClick={() => setSidebarOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="sekpriAI" className="h-16 w-auto object-contain" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 text-white/30 hover:text-white transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">

          {/* Mail section */}
          <div className="mb-1">
            <button
              onClick={() => setFoldersExpanded((v) => !v)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/20 hover:text-[#c9a96e]/50 transition-colors"
            >
              <span className="flex-1 text-left">Mail</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", foldersExpanded && "rotate-180")} />
            </button>

            <AnimatePresence initial={false}>
              {foldersExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden space-y-0.5"
                >
                  {EMAIL_FOLDERS.map((f) => {
                    const Icon = f.icon;
                    const isActive = isInboxSection && activeFolder === f.folder;
                    return (
                      <Link
                        key={f.folder}
                        href={`/inbox?folder=${f.folder}`}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-all duration-150",
                          isActive
                            ? "text-white"
                            : "text-white/35 hover:text-white/65 hover:bg-white/[0.04]"
                        )}
                        style={isActive ? {
                          background: "linear-gradient(90deg, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.04) 100%)",
                          borderLeft: "2px solid rgba(201,169,110,0.5)",
                        } : { borderLeft: "2px solid transparent" }}
                      >
                        <Icon className={cn(
                          "h-3.5 w-3.5 flex-shrink-0",
                          isActive ? "text-[#c9a96e]" : "text-white/25"
                        )} />
                        <span className="text-sm">{f.label}</span>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="my-2" style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.1), transparent)" }} />

          {/* Features section */}
          <div>
            <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/15">
              Features
            </p>
            {TOP_NAV.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-all duration-150",
                    isActive
                      ? "text-white"
                      : "text-white/35 hover:text-white/65 hover:bg-white/[0.04]"
                  )}
                  style={isActive ? {
                    background: "linear-gradient(90deg, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.04) 100%)",
                    borderLeft: "2px solid rgba(201,169,110,0.5)",
                  } : { borderLeft: "2px solid transparent" }}
                >
                  <item.icon className={cn(
                    "h-3.5 w-3.5 flex-shrink-0",
                    isActive ? "text-[#c9a96e]" : "text-white/25"
                  )} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="p-3" style={{ borderTop: "1px solid rgba(201,169,110,0.07)" }}>
          <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
            <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.3), rgba(201,169,110,0.1))", border: "1px solid rgba(201,169,110,0.2)" }}>
              <span className="text-[10px] font-semibold text-[#c9a96e]">
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
            <span className="flex-1 truncate text-xs text-white/25">{user.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="flex-shrink-0 rounded p-1 text-white/15 hover:text-white/50 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <header className="flex h-20 flex-shrink-0 items-center gap-3 px-4 lg:hidden"
          style={{
            background: "rgba(8,8,16,0.85)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(201,169,110,0.07)",
          }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded p-1.5 text-white/30 hover:text-white transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/inbox" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="sekpriAI" className="h-16 w-auto object-contain" />
          </Link>
        </header>

        {/* Page content */}
        <main
          className={cn(
            "flex-1 min-h-0",
            isFullHeight ? "overflow-hidden" : "overflow-y-auto p-4 md:p-6"
          )}
          style={{ background: "transparent" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
