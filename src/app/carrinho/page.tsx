import Link from "next/link";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

type CartItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number; // price * quantity
};

export default function CartPage() {
  // In a real app, this would come from state management or session
  // For now, we'll use a simple approach
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to load cart from localStorage or session
    // For this demo, we'll initialize with some data if available
    const stored = localStorage.getItem('lume-cart');
    if (stored) {
      setItems(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal; // No tax/discount for simplicity

  const removeItem = (productId: string) => {
    setItems(items.filter((item) => item.productId !== productId));
    localStorage.setItem('lume-cart', JSON.stringify(items));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('lume-cart');
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      setError('Carrinho vazio');
      return;
    }

    // Here would be the checkout logic
    // For now, just show an alert and clear cart
    if (window.confirm(`Confirmar pedido de R$ ${formatCurrency(total)}?`)) {
      // In a real app, this would create an order in the database
      clearCart();
      window.location.href = '/obrigado';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="animate-spin rounded-billax"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Carrinho</h2>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="h-12 w-12 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="h-6 w-6 text-gray-300 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 12a1 1 0 011-1h12a1 1 0 010 2H5a1 1 0 01-1-1zM3 7a1 1 0 011-1h2a1 1 0 010 1h14a1 1 0 010 1h-2a1 1 0 01-1-1V7zm10.5 4.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-7.5 0a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM3 12a1 1 0 011-1h12a1 1 0 010 2H5a1 1 0 01-1-1zM3 7a1 1 0 011-1h2a1 1 0 010 1h14a1 1 0 010 1h-2a1 1 0 01-1-1V7zm0 4a1 1 0 012 0v2a1 1 0 01-2 0v-2z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Carrinho Vazio</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Não há itens no seu carrinho. Comece a comprar produtos na Lume Store.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-md px-5 py-3 text-base font-medium text-white transition-colors bg-primary-600 hover:bg-primary-700"
          >
            Ver Produtos
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-primary-600">Lume Store</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="relative rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 12a1 1 0 011-1h12a1 1 0 010 2H5a1 1 0 01-1-1zM3 7a1 1 0 011-1h2a1 1 0 010 1h14a1 1 0 010 1h-2a1 1 0 01-1-1V7zm10.5 4.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-7.5 0a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM3 12a1 1 0 011-1h12a1 1 0 010 2H5a1 1 0 01-1-1zM3 7a1 1 0 011-1h2a1 1 0 010 1h14a1 1 0 010 1h-2a1 1 0 01-1-1V7zm0 4a1 1 0 012 0v2a1 1 0 01-2 0v-2z"/>
              </svg>
              Loja
            </Link>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setShowModal(!showModal)}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Finalizar
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-800 p-4 rounded mb-4 border border-red-200 dark:border-red-600">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="min-h-[300px] flex items-center justify-center text-gray-600 dark:text-gray-400">
            <p>Seu carrinho está vazio</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 space-y-4">
              {/* Items List */}
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {item.productName}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Qtd: {item.quantity}
                      </span>
                    </div>
                    <span className="font-medium text-primary-600">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Subtotal</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(subtotal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(total)}
                  </p>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCheckout}
                  className="w-full rounded border border-primary-600 px-6 py-3 text-white font-medium transition-colors hover:bg-primary-700"
                >
                  Finalizar Pedido - {formatCurrency(total)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method Selector */}
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-font-medium text-gray-700 dark:text-gray-300 mb-4">Forma de Pagamento</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 rounded-md px-3 py-2 border border-gray-300 dark:border-gray-600 cursor-pointer select-none">
                <input
                  type="radio"
                  name="payment-method"
                  value="pix"
                  className="rounded-inner w-4 h-4"
                />
                <span>PIX</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 rounded-md px-3 py-2 border border-gray-300 dark:border-gray-600 cursor-pointer select-none">
                <input
                  type="radio"
                  name="payment-method"
                  value="card"
                  className="rounded-inner w-4 h-4"
                />
                <span>Cartão</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 rounded-md px-3 py-2 border border-gray-300 dark:border-gray-600 cursor-pointer select-none">
                <input
                  type="radio"
                  name="payment-method"
                  value="cash"
                  className="rounded-inner w-4 h-4"
                />
                <span>Dinheiro</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 rounded-md px-3 py-2 border border-gray-300 dark:border-gray-600 cursor-pointer select-none">
                <input
                  type="radio"
                  name="payment-method"
                  value="fiado"
                  className="rounded-inner w-4 h-4"
                  disabled={items.length === 0}
                />
                <span>Fiado</span>
              </label>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}