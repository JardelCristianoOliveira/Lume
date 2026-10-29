/**
 * Supabase Provider for Next.js App Router
 * 
 * This provider wraps the Supabase client and makes it available
 * throughout the application via React context.
 * 
 * Important: This uses the browser client only. Server components
 * should use the serverClient directly from the utils.
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useMemo } from 'react';

type SupabaseClient = ReturnType<typeof createBrowserClient>;

type AuthCallbacks = {
  onSessionChange?: (session: import('@supabase/ssr').Session | null) => void;
  onError?: (error: Error) => void;
};

export function useSupabase(
  options: {
    onAuthStateChange?: (session: import('@supabase/ssr').Session | null) => void;
  } = {}
) {
  const supabase = useSupabaseClient();

  useEffect(() => {
    const { data: { session } } = supabase.auth.getSession();

    if (options.onAuthStateChange) {
      options.onAuthStateChange(session);
    }

    const { data } = supabase.auth.onAuthStateChange((newSession) => {
      options.onAuthStateChange?.(newSession);
    });

    return () => {
      supabase.auth.offAuthStateChange(data.off);
    };
  }, [supabase, options.onAuthStateChange]);

  return supabase;
}

export function useSupabaseUser() {
  const supabase = useSupabaseClient();
  return supabase.auth.getUser();
}

function useSupabaseClient(): SupabaseClient {
  // This will be injected by the <SupabaseProvider> below
  throw new Error('useSupabaseClient must be used within SupabaseProvider');
}

export const SupabaseProvider = ({
  children,
  onSessionChange,
}: {
  children: React.ReactNode;
  onSessionChange?: (session: import('@supabase/ssr').Session | null) => void;
}) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          if (typeof window === 'undefined') return [];
          return document.cookie.split(';').map((c) => c.trim()).filter((c) => c.length > 0);
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              document.cookie = `${name}=${value}; path=/; max-age=${options?.maxAge || 0}`;
            });
          } catch (e) {
            // Ignore cookie errors in provider
          }
        },
        removeAll() {
          try {
            document.cookie.split(';').forEach((c) => {
              document.cookie = c.replace(/^.*=/, '') + '=; Max-Age=0; path=/';
            });
          } catch (e) {
            // Ignore cookie errors
          }
        },
      },
    });
  }, [supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      onSessionChange?.(session);
    });
  }, [supabase, onSessionChange]);

  return <>{children}</>;
};

export default SupabaseProvider;