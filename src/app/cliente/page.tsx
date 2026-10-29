import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { formatCurrency } from "@/lib/utils";

export default function CustomerProfile() {
  const { serverClient } = useSupabase();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serverClient) return;

    const loadCustomerData = async () => {
      try {
        const { data: session } = await serverClient.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        // Get customer profile linked to user
        const { data: profile } = await serverClient
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // Get customer record
        const { data: customer, error: customerError } = await serverClient
          .from('customers')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (customerError && customerError.code !== 'PGRST116') throw customerError;

        setCustomer(customer || {
          id: uuidv4(),
          user_id: session.user.id,
          name: profile?.full_name || '',
          phone: profile?.phone || '',
          email: session.user.email,
          notes: '',
          created_at: new Date().toISOString(),
        });

        // Get order history
        const { data: userOrders, error: ordersError } = await serverClient
          .from('orders')
          .select('*, sales(*)')
          .eq('customer_id', customer?.id)
          .order('sale_date', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(userOrders || []);

        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar perfil do cliente:', err);
        setError('Erro ao carregar perfil. Tente novamente.');
        setLoading(false);
      }
    };

    loadCustomerData();
  }, [serverClient]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin rounded-billax"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Perfil do Cliente</h2>
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <a href="/auth/login" className="font-medium text-primary-600 hover:underline">Voltar ao login</a>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-primary-600">Lume Store</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 12a1 1 0 011-1h12a1 1 0 010 2H5a1 1 0 01-1-1zM3 7a1 1 0 011-1h2a1 1 0 010 1h14a1 1 0 010 1h-2a1 1 0 01-1-1V7zm10.5 4.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-7.5 0a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM3 12a1 1 0 011-1h12a1 1 0 010 2H5a1 1 0 01-1-1zM3 7a1 1 0 011-1h2a1 1 0 010 1h14a1 1 0 010 1h-2a1 1 0 01-1-1V7zm0 4a1 1 0 012 0v2a1 1 0 01-2 0v-2z"/>
              </svg>
              Início
            </Link>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {customer?.name || 'Meu Perfil'}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Meu Perfil</h2>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome
              </label>
              <p className="text-lg text-gray-900 dark:text-gray-100 font-medium">
                {customer?.name || 'Não cadastrado'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                E-mail
              </label>
              <p className="text-lg text-gray-900 dark:text-gray-100 font-medium">
                {customer?.email || '—'}
              </p>
            </div>
          </div>

          {/* Phone */}
          {customer?.phone && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone
              </label>
              <p className="text-lg text-gray-900 dark:text-gray-100 font-medium">
                {customer?.phone}
              </p>
            </div>
          )}

          {/* Notes */}
          {customer?.notes && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observações
              </label>
              <p className="text-base text-gray-600 dark:text-gray-400">
                {customer.notes}
              </p>
            </div>
          )}

          {/* Order History */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Histórico de Pedidos
            </label>
            
            {orders.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 mt-4">
                Ainda não realizou pedidos
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                        Data
                      </th>
                      <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                        Status
                      </th>
                      <th className="p-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="p-3 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(order.sale_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3">
                          <span className={
                            order.status === 'paid' ? 'text-success-600' :
                            order.status === 'pending' ? 'text-primary-600' :
                            'text-gray-500'
                          }>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-right">
                          {formatCurrency(order.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper - would normally be at top of file but keeping structure
const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0,
    v = c === 'x' ? r : r & 0x3 | 0x8;
  return v.toString(16);
});