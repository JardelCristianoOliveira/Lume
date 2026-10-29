import "./globals.css";
import { SupabaseProvider } from "@/lib/supabase/provider";
import { useState, useEffect } from "react";
import { hasRole } from "@/lib/supabase/client";
import Link from "next/link";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Check if user has admin role
    const checkAdmin = async () => {
      try {
        const { hasAdminRole } = await import('@/lib/supabase/client');
        // We'll check this differently - let's use a simpler approach
        const { data: profile } = await fetch('/api/profile', {
          credentials: 'include'
        }).then(res => res.json);
        setIsAdmin(profile?.role === 'admin');
        setUserName(profile?.full_name || 'Proprietária');
      } catch (err) {
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, []);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Verificando permissões...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-primary-600">Lume Store</span>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3 12a1 1 0 011-1h12a1 1 0 010 2H5a1 1 0 01-1-1zM3 7a1 1 0 011-1h2a1 1 0 010 1h14a1 1 0 010 1h-2a1 1 0 01-1-1V7zm10.5 4.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-7.5 0a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" />
                  </svg>
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/pedidos"
                  className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 7v6l4 2v8l-5 1.5L17 15l-5-1.5V5l5-1.5V7zm0 4a1 1 0 012 0v2a1 1 0 01-2 0v-2zm-5.5 3.2a1.5 1.5 0 110-3 1.5 1.5 0 013 0zM3 12a1 1 0 011-1h12a1 1 0 010 2H5a1 1 0 01-1-1z" />
                  </svg>
                  Pedidos
                </Link>
              </>
            ) : null}
            <Link
              href="/auth/login"
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isAdmin ? 'Painel Admin' : 'Login'}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}