import { useState, useEffect } from "react";
import Link from "next/link";
import { useSupabase } from "@/lib/supabase/provider";
import { getReceivables, getReceivableDetails, registerPayment, createReceivable } from "@/actions/receivables";
import { formatCurrency } from "@/lib/utils";

export default function FiadosPage() {
  const { serverClient } = useSupabase();
  const [receivables, setReceivables] = useState([]);
  const [selectedReceivable, setSelectedReceivable] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'pix',
    reference: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'this-month' | 'overdue' | 'upcoming'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!serverClient) return;

    const loadFiados = async () => {
      try {
        const { data, error } = await getReceivables({
          period: filterPeriod === 'all' ? undefined : filterPeriod,
        });

        if (error) throw error;
        setReceivables(data || []);
        setIsLoading(false);
      } catch (err) {
        console.error('Erro ao carregar fiados:', err);
        setError('Erro ao carregar fiados. Tente novamente.');
        setIsLoading(false);
      }
    };

    loadFiados();
  }, [serverClient, filterPeriod]);

  const handleFilterChange = (period: string) => {
    setFilterPeriod(period === 'all' ? 'all' : period as any);
  };

  const handlePaymentsPeriodChange = (period: string) => {
    setFilterPeriod(period);
    loadFiadosData();
  };

  const loadFiadosData = async () => {
    if (!serverClient) return;
    try {
      const { data, error } = await getReceivables({
        period: filterPeriod === 'all' ? undefined : filterPeriod,
      });
      setReceivables(data || []);
    } catch (err) {
      setError('Erro ao atualizar lista');
    }
  };

  const openPaymentForm = (receivable: any) => {
    setSelectedReceivable(receivable);
    // Initialize form with current balance
    setPaymentForm({
      amount: '',
      payment_method: 'pix',
      reference: '',
      notes: '',
    });
    setShowPaymentForm(true);
  };

  const closePaymentForm = () => {
    setShowPaymentForm(false);
    setSelectedReceivable(null);
    setPaymentForm({
      amount: '',
      payment_method: 'pix',
      reference: '',
      notes: '',
    });
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReceivable) return;
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      setError('Informe um valor de pagamento maior que zero');
      return;
    }

    try {
      const result = await registerPayment({
        receivable_id: selectedReceivable.id,
        amount: Number(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
      });

      if (result.success) {
        setError(null);
        closePaymentForm();
        loadFiadosData();
        // Show success message
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { 
            title: 'Pagamento registrado',
            message: `R$ ${formatCurrency(result.receivable.balance_due)} restante`
          }
        }));
      } else {
        setError(result.error || 'Erro ao registrar pagamento');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin rounded-billax"></span>
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
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 12a1 1 0 011-1h12a1 1 0 010 2H5a1 1 0 01-1-1zM3 7a1 1 0 011-1h2a1 1 0 010 1h14a1 1 0 010 1h-2a1 1 0 01-1-1V7zm10.5 4.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-7.5 0a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM3 12a1 1 0 011-1h12a1 1 0 010 2H5a1 1 0 01-1-1zM3 7a1 1 0 011-1h2a1 1 0 010 1h14a1 1 0 010 1h-2a1 1 0 01-1-1V7zm0 4a1 1 0 012 0v2a1 1 0 01-2 0v-2z"/>
              </svg>
              Dashboard
            </Link>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {receivables.length} fiados
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => handleFilterChange(e.target.value)}
              className="rounded border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
            >
              <option value="all">Todos</option>
              <option value="today">Hoje</option>
              <option value="this-month">Este Mês</option>
              <option value="overdue">Vencidos</option>
              <option value="upcoming">Vencendo em Breve</option>
            </select>
            <button
              onClick={() => setShowPaymentForm(true)}
              disabled={!selectedReceivable}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {selectedReceivable ? 'Registrar Pagamento' : 'Novo Fiado'}
            </button>
          </div>
        </div>
      </nav>

      <main className="p-6">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-800 p-4 rounded mb-4 border border-red-200 dark:border-red-600">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-primary-600">
              {receivables.filter(r => isOverdue(r.due_date) && r.status !== 'quitado').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Vencidos</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-warning-600">
              {receivables.filter(r => 
                r.due_date > new Date() && r.due_date <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && r.status !== 'quitado'
              ).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Vencendo em 7 dias</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-success-600">
              {receivables.filter(r => r.status === 'quitado').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Quitados</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {receivables.reduce((sum, r) => sum + (r.balance_due || 0), 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Recebível</div>
          </div>
        </div>

        {/* Receivables List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-x-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Contas a Receber ({receivables.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 animate-spin rounded-billax"></div>
          ) : receivables.length === 0 ? (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">
              <p>Nenhum fiado registrado</p>
              <p className="mt-2">Registre uma venda fiada para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Cliente
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Data Venda
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Vencimento
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Status
                    </th>
                    <th className="p-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                      Original
                    </th>
                    <th className="p-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                      Pendente
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.map((receivable) => (
                    <tr key={receivable.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                        {receivable.customers?.name || 'Cliente'}
                      </td>
                      <td className="p-3 text-sm text-gray-500 dark:text-gray-400">
                        {receivable.sale_date ? new Date(receivable.sale_date).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="p-3 text-sm font-medium">
                        {new Date(receivable.due_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3">
                        <span className={
                          receivable.status === 'quitado' ? 'text-success-600' :
                          receivable.status === 'vencido' ? 'text-error-600' :
                          receivable.status === 'vencendo_breve' ? 'text-warning-600' :
                          'text-primary-600'
                        }>
                          {receivable.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(receivable.original_amount)}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(receivable.balance_due || 0)}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openPaymentForm(receivable)}
                            className="text-primary-600 hover:underline text-sm"
                            title="Registrar Pagamento"
                          >
                            Receber
                          </button>
                          {receivable.status !== 'quitado' && (
                            <button
                              onClick={() => window.open(
                                `https://wa.me/${receivable.customers?.phone?.replace(/\D/g, '') || ''}?text=Olá!+Gostaria+de+informar+sobre+a+preciso+de+pagamento+do+fiado+referente+a+compra+realizada+em+${new Date(receivable.sale_date).toLocaleDateString('pt-BR')}.+Quando+puder,+me+avise+sobre+a+previsão+de+pagamento.`,
                                '_blank'
                              )}
                              className="text-teal-600 hover:underline text-sm"
                              title="Enviar WhatsApp"
                            >
                              WhatsApp
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Form */}
          {showPaymentForm && selectedReceivable && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 max-w-md mx-auto border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Registrar Pagamento para {selectedReceivable.customers?.name}
              </h3>
              
              {error && (
                <div className="bg-red-100 dark:bg-red-900 text-red-800 p-4 rounded mb-4 border border-red-200 dark:border-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <input
                  type="hidden"
                  value={selectedReceivable.id}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor do Pagamento
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    min="0.01"
                    step="0.01"
                    className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                    placeholder="0,00"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Deve ser maior que zero e ≤ saldo devedor
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Forma de Pagamento
                  </label>
                  <select
                    name="payment_method"
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                  >
                    <option value="pix">PIX</option>
                    <option value="cash">Dinheiro</option>
                    <option value="card">Cartão</option>
                    <option value="fiado">Fiado (Crédito)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Referência / Comprovante
                  </label>
                  <input
                    type="text"
                    name="reference"
                    value={paymentForm.reference || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                    placeholder="Número do comprovante, transação ID, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observações
                  </label>
                  <textarea
                    name="notes"
                    value={paymentForm.notes || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    rows={3}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                    placeholder="Observações sobre o pagamento..."
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full rounded border border-primary-600 px-4 py-3 text-white font-medium transition-colors hover:bg-primary-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processando...' : 'Registrar Pagamento'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}