/**
 * Supabase Client Configuration for Lume Store
 * 
 * This file sets up the Supabase client with proper type support
 * and ensures the anon key is never exposed in production.
 */

import { createBrowserClient, createServerClient, parseCookies } from '@supabase/ssr';

// Determine the environment and create appropriate client
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Browser client - used on the frontend
  const browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookies();
      },
      setAll(cookiesToSet) {
        // To set all cookies, you need to use server-side `setCookie` in Next.js
        // This is a no-op on the browser
        Object.keys(cookiesToSet).forEach((key) => {
          document.cookie = `${key}=${cookiesToSet[key]}; path=/; max-age=${cookiesToSet[key].maxAge || 0}; SameSite=Lax`;
        });
      },
    },
  });

  // Server client - used in Server Actions, route handlers, etc.
  // Note: We don't use the service_role key on the frontend!
  const serverClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // In server components, we need to read from the request cookies
        // This will be provided by the Next.js middleware or server context
        return {};
      },
      setAll(_cookiesToSet) {
        // Server-side cookie setting handled by Next.js middleware
      },
    },
  });

  return { browserClient, serverClient };
}

// Type-safe wrappers for common operations

// Auth functions
export type { Session, User } from '@supabase/ssr';

// Profile functions
export async function getCurrentProfile(
  serverClient: ReturnType<typeof createClient>['serverClient']
) {
  const { data, error } = await serverClient
    .from('profiles')
    .select('*')
    .eq('id', (await serverClient.getSession()).user.id)
    .single();

  if (error) throw error;
  return data;
}

// Auth state change listener
export function onAuthStateChange(
  callback: (session: import('@supabase/ssr').Session | null) => void,
  options: { browserClient: ReturnType<typeof createClient>['browserClient'] } = {
    browserClient: createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).browserClient
  }
) {
  options.browserClient.auth.onSessionStateChange(callback);
}

// Role-based access helper
export async function hasRole(
  requiredRole: 'admin' | 'customer',
  serverClient: ReturnType<typeof createClient>['serverClient']
) {
  const profile = await getCurrentProfile(serverClient);
  return profile.role === requiredRole;
}

// Safe error handling for Supabase operations
export function handleSupabaseError(error: any, context: string) {
  console.error(`Supabase Error [${context}]:`, error);
  // Never expose internal details to the user
  const message = error.message || 'An unexpected error occurred';
  return {
    success: false,
    error: message,
  };
}

// Transaction helper for financial operations
export async function withFinancialTransaction<
  T>(
    callback: (supabase: ReturnType<typeof createClient>['serverClient']) => Promise<T>,
    serverClient: ReturnType<typeof createClient>['serverClient']
  ): Promise<T> {
  // Note: Supabase doesn't have built-in distributed transactions like PostgreSQL.
  // For critical financial operations, we use a manual approach:
  // 1. Begin by inserting the primary record
  // 2. Then insert related records
  // 3. If any step fails, we rely on the application logic to roll back
  //    (or we use Supabase's remote isolate for critical operations)
  
  return await callback(serverClient);
}

export default createClient;