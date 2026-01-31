import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not configured. Cloud features disabled.");
}

// Workaround for Web Locks API deadlock issue in supabase-js
// See: https://github.com/supabase/supabase-js/issues/1594
// The GoTrueClient uses navigator.locks with infinite timeout, which can cause
// setSession and other auth operations to hang indefinitely.
// This no-op lock bypasses the locking mechanism entirely, which is safe for
// desktop apps that don't need cross-tab synchronization.
const noOpLock = async (
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<unknown>
): Promise<unknown> => {
  return await fn();
};

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase not configured");
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: noOpLock,
    },
  });
}

let clientInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}
