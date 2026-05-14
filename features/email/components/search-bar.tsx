"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [local, setLocal] = useState(value);

  // Debounce: propagate after 300ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(local);
    }, 300);
    return () => clearTimeout(timer);
  }, [local, onChange]);

  // Sync external value changes
  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div className="relative" role="search">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Search emails..."
        aria-label="Search emails"
        className="flex h-9 w-full rounded-lg border border-white/[0.1] bg-white/[0.04] pl-9 pr-8 py-1 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
      />
      {local && (
        <button
          onClick={() => {
            setLocal("");
            onChange("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 hover:bg-accent"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
