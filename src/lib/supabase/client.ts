import { createServerClient as createSupabaseClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export async function parseCookies(): Promise<CookieStore> {
  return cookies();
}

export function createServerClient(cookieStore: CookieStore) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

export async function createSupabaseServerClient() {
  return createServerClient(await parseCookies());
}

export async function hasRole(
  requiredRole: 'admin' | 'customer',
  supabase: SupabaseClient
) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return false;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return profile.role === requiredRole;
}

export async function hasAdminRole() {
  return hasRole('admin', await createSupabaseServerClient());
}

export function handleSupabaseError(error: unknown, context: string) {
  console.error(`Supabase Error [${context}]:`, error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'An unexpected error occurred',
  };
}
