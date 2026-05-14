import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

// Cache the auth check for the duration of the request
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // AppShell is a client component — children render immediately
  // No Suspense wrapper needed here; each page handles its own loading state
  return <AppShell user={user}>{children}</AppShell>;
}
