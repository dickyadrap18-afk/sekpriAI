"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EmailAccount } from "@/lib/supabase/types";

export function useAccounts() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("email_accounts")
        .select("*")
        .order("created_at", { ascending: true });

      setAccounts((data as EmailAccount[]) ?? []);
      setLoading(false);
    }
    fetch();
  }, []);

  return { accounts, loading };
}
