import { useState, useEffect } from "react";
import Link from "next/link";
import { useSupabase } from "@/lib/supabase/provider";
import { hasRole } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

export default function DashboardHome() {
  const { serverClient } = useSupabase();
  const [salesToday, setSalesToday] = useState<Array<{ id: string; total: number; status: string; fiado: boolean; created_at: string }>>([]);
  const [totalReceived, setTotalReceived] = useState(0);
  const [totalReceivable, setTotalReceivable] = useState(0);
  const [pendingPayments, setPendingPayments] = useState<Array<{ id: string; customer: string; amount: number; due_date: string; status: string }>>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Array<{ id: string; name: string; stock: number; price: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!serverClient) return;

    const loadData = async () => {
      try {
        // Check admin role
        const { data: profile } = await serverClient
          .from('profiles')
          .select('role')
          .eq('id', (await serverClient.getSession()).user.id)
          .single();

        if (profile?.role !== 'admin') {
          // Redirect non-admin
          window.location.href = '/';
          return;
        }

        // Load sales today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();

        const { data: todaySales, error: salesError } = await serverClient
          .from('sales')
          .select('*, customers(name)')
          .eq('user_id', (await serverClient.getSession()).user.id)
          .gte('sale_date', todayStr)
          .order('sale_date', { ascending: false });

        if (salesError) throw salesError;
        setSalesToday(todaySales || []);

        // Calculate total received
        const { data: payments, error: payError } = await serverClient
          .from('payments')
          .select('*')
          .eq('customer_id', null); // Simplified - get all payments

        if (payError) throw payError;
        const received = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        setTotalReceived(received);

        // Load receivables
        const { data: receivables, error: recvError } = await serverClient
          .from('receivables')
          .select('*, customers(name)')
          .order('due_date', { ascending: true });

        if (recvError) throw recvError;
        setTotalReceivable(
          (receivables || []).reduce((sum, r) => sum + (r.balance_due || 0), 0)
        );

        // Pending payments (fiados vencendo ou vencidos)
        const pending = (receivables || [])
          .filter(r => r.status !== 'quitado')
          .map(r => ({
            id: r.id,
            customer: r.customers?.name || 'Cliente',
            amount: r.balance_due || 0,
            due_date: r.due_date,
            status: r.status
          }));
        setPendingPayments(pending);

        // Low stock products
        const { data: products, error: prodError } = await serverClient
          .from('products')
          .select('name, stock_quantity, price')
          .lt('stock_quantity', 5);

        if (prodError) throw prodError;
        setLowStockProducts(products || []);

      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [serverClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin rounded-billax"></span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Cards Summary -->
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Visão Geral</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="text-3xl font-bold text-primary-600">{salesToday.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Vendas hoje</div>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="text-3xl font-bold text-success-600">{formatCurrency(totalReceived)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Recebido hoje</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="text-3xl font-bold text-error-600">{totalReceivable > 0 ? formatCurrency(totalReceivable) : 'R$ 0,00'}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total a receber</div>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="text-3xl font-bold text-warning-600">
              {pendingPayments.filter(p => p.status === 'vencido').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pagamentos atrasados</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Atalhos Rápidos</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/dashboard/novavenda"
            className="group rounded-xl border border-gray-300 dark:border-gray-600 p-4 hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors cursor-pointer"
          >
            <svg className="h-5 w-5 group-hover:text-primary-600 transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 12a1 1 0 011-1h12a1 1 0 010 2H5a1 1 0 01-1-1zM3 7a1 1 0 011-1h2a1 1 0 010 1h14a1 1 0 010 1h-2a1 1 0 01-1-1V7zm10.5 4.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-7.5 0a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM3 12a1 1 0 011-1h12a1 1 0 010 2H5a1 1 0 01-1-1zM3 7a1 1 0 011-1h2a1 1 0 010 1h14a1 1 0 010 1h-2a1 1 0 01-1-1V7zm0 4a1 1 0 012 0v2a1 1 0 01-2 0v-2zm-7.5 3.2a1.5 1.5 0 110-3 1.5 1.5 0 013 0zm4 0a1.5 1.5 0 100 3 1.5 1.5 0 00-3 0zm11 0a1.5 1.5 0 100 3 1.5 1.5 0 00-3 0zM12 7v6l4 2v8l-5 1.5L17 15l-5-1.5V5l5-1.5V7z"/>
            </svg>
            <span className="block ml-3">Registrar Venda</span>
          </Link>
          <Link
            href="/dashboard/fiados"
            className="group rounded-xl border border-gray-300 dark:border-gray-600 p-4 hover:bg-error-100 dark:hover:bg-error-900 transition-colors cursor-pointer"
          >
            <svg className="h-5 w-5 group-hover:text-error-600 transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 7a2 2 0 00-2-2H5a2 2 0 00-2 2v4h2v-4H5a2 2 0 00-2 2v4h20v-4a2 2 0 00-2-2zM5 7a2 2 0 002 2h14a2 2 0 002-2v-4H5v4z"/>
            </svg>
            <span className="block ml-3">Fiados</span>
          </Link>
          <Link
            href="/dashboard/clientes"
            className="group rounded-xl border border-gray-300 dark:border-gray-600 p-4 hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors cursor-pointer"
          >
            <svg className="h-5 w-5 group-hover:text-primary-600 transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 21v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2M19 14c0 .66-.11 1.3-.3 1.88l1.5 1.5a2 2 0 01-2.83 0l-1.51-1.5a12 12 0 00-3.47 3.47l1.41 1.41C17.59 18.09 18 17.25 18 16v-2c0-2.76-2.24-5-5-5s-5 2.24-5 5v2m0-10c0 .66-.11 1.3-.3 1.8l1.5 1.5a2 2 0 01-2.83 0l-1.51-1.5A11.95 11.95 0 0112 3a11.95 11.95 0 01.99-3.03l1.41 1.41zM12 3a9 9 0 019 9h-3v-2h3zm0 8a5 5 0 015 5h-3v-2H12z"/>
            </svg>
            <span className="block ml-3">Clientes</span>
          </Link>
        </div>
      </div>

      <!-- Recent Activity -->
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Atividade Recente</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {/* Will be populated with recent sales/activity */}
          {isLoading ? (
            <p className="text-gray-500">Carregando...</p>
          ) : (
            salesToday.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded border border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {sale.customers?.name || 'Venda'} - {formatCurrency(sale.total)}
                </span>
                <span className="text-xs {
                  sale.status === 'paid' ? 'text-success-600' : 'text-gray-500'
                }">
                  {sale.status}
                </span>
              </div>
            ))
          }}
        </div>
      </div>
    </div>
  );
}