import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase/provider";
import { listProducts, getProduct } from "@/actions/products";
import { formatCurrency } from "@/lib/utils";

export default function ProductDetailPage() {
  // Get product ID from URL query
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    if (!productId) {
      setError('ID do produto não informado');
      setLoading(false);
      return;
    }

    const loadProduct = async () => {
      try {
        const { data, error } = await getProduct(productId);

        if (error) throw error;
        setProduct(data?.product || data);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar produto:', err);
        setError('Produto não encontrado.');
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="animate-spin rounded-billax"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Produto</h2>
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <a href="/" className="font-medium text-primary-600 hover:underline">Voltar para a loja</a>
        </p>
      </div>
    );
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Produto não encontrado</div>;
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
              {product.name}
            </span>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 border border-gray-200 dark:border-gray-700">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Product Image */}
            <div>
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt_text || product.name}
                  width={500}
                  height={400}
                  className="rounded-xl object-cover w-full h-full shadow-lg"
                />
              ) : (
                <div
                  className="rounded-xl h-64 w-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                >
                  <svg
                    className="h-16 w-16 text-gray-300 dark:text-gray-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M11 4h.01M11 12h.01M11 20h.01M19 10c0 8-8 8-8 8M5 10c0 8-8 8-8 8M7 4h.01M7 12h.01M7 20h.01M3 10c0 8 8 8 8 8M9 3v2m0 18v2m-6-3h6m5 0v2m0-18h6m-5 0V9m0 12h6m5 0V9m0 12h6m-5 0h6M3 13a9 9 0 1018 0 9 9 0 00-18 0z" />
                  </svg>
                </div>
              )}

              {/* Product Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {product.description || 'Sem descrição'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                      Preço: {formatCurrency(product.price)}
                    </p>
                    {product.promotional_price && (
                      <p className="text-sm text-gray-400 line-through">
                        Por: {formatCurrency(product.promotional_price)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                      Estoque: {product.stock_quantity}
                    </p>
                    {product.stock_quantity <= 0 && (
                      <p className="text-xs text-error-600">
                        Indisponível
                      </p>
                    )}
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantidade
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                      className="rounded-l-xl bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      -
                    </button>
                    <span className="min-w-16 text-center font-medium">
                      {selectedQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedQuantity((q) => q + 1)}
                      className="rounded-r-xl bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
                      disabled={selectedQuantity >= product.stock_quantity}
                    >
                      +
                    </button>
                  </div>
                  {selectedQuantity >= product.stock_quantity && product.stock_quantity > 0 && (
                    <p className="text-xs text-warning-600 mt-1">
                      Estoque limitado a {product.stock_quantity}
                    </p>
                  )}
                  {selectedQuantity > product.stock_quantity && (
                    <p className="text-xs text-error-600 mt-1">
                      Quantidade solicitada excede o estoque
                    </p>
                  )}
                </div>

                {/* Buy Button */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => addToCart(product, selectedQuantity)}
                    className="w-full rounded border border-primary-600 px-6 py-3 text-white font-medium transition-colors hover:bg-primary-700"
                  >
                    Adicionar ao Carrinho - {formatCurrency(product.price * selectedQuantity)}
                  </button>
                </div>
              </div>
            </div>

            {/* Product Specs */}
            <div>
              <h3 className="text-font-medium text-gray-700 dark:text-gray-300 mb-4">Detalhes</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">SKU:</span> {product.sku || 'Não informado'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Categoria:</span> 
                    {product.categories?.name || 'Sem categoria'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Status:</span> 
                    {product.status === 'published' ? 'Disponível' : product.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function addToCart(product: any, quantity: number) {
  // Simple cart implementation - would normally use state management
  // For now, just show a message and navigate to cart
  window.dispatchEvent(new CustomEvent('add-to-cart', {
    detail: { productId: product.id, productName: product.name, quantity, price: product.price }
  }));
  
  setShowCart(true);
  // Navigate to cart after a moment
  setTimeout(() => {
    window.location.href = '/carrinho';
  }, 1000);
}