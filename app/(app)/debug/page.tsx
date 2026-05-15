import { createClient } from "@/lib/supabase/server";

export default async function DebugPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session } = await supabase.auth.getSession();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug Info</h1>
      
      <div className="space-y-4">
        <section className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold mb-2">User Info</h2>
          <pre className="text-xs text-white/70 overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </section>

        <section className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold mb-2">Session Info</h2>
          <pre className="text-xs text-white/70 overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </section>

        <section className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold mb-2">Environment</h2>
          <div className="text-xs text-white/70 space-y-1">
            <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</p>
            <p>NEXT_PUBLIC_APP_URL: {process.env.NEXT_PUBLIC_APP_URL || 'Not set'}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
