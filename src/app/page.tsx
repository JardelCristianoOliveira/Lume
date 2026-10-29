'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { listProducts } from "@/actions/products";
import { formatCurrency } from "@/lib/utils";

export default function HomePage() {
  const [products, setProducts] = useState<
    Awaited<ReturnType<typeof listProducts>>["products"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const result = await listProducts({
          status: 'published',
          sortBy: 'name',
          sortOrder: 'asc',
          page: 1,
          pageSize: 8,
        });

        setProducts(result.products);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        setError('Erro ao carregar produtos. Tente novamente.');
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="animate-spin rounded-billax"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Nav */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-primary-600">Lume Store</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="relative rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colons"
            >
              Conta / Login
            </Link>
          </div>
        </div>
      </header>

      <main className="p-6">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-800 p-4 rounded mb-4 border border-red-200 dark:border-red-600">
            {error}
          </div>
        )}

        {/* Hero Section */}
        <section className="mb-8">
          <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="relative h-64 sm:h-80">
              <Image
                src="/next.svg"
                alt="Lume Store"
                width={200}
                height={200}
                className="object-cover w-full h-full"
                priority
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div className="p-6 sm:p-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Bem-vindo à Lume Store
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Descubra produtos frescos e de qualidade para sua família.
              </p>
              <div className="mt-6 sm:mt-8">
                <Link
                  href="/produtos"
                  className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-base font-medium text-white transition-colors bg-primary-600 hover:bg-primary-700"
                >
                  Ver Catálogo
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section>
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Produtos Disponíveis
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden hover:border-primary-500 transition-colors cursor-pointer"
                  style={{ transition: 'border-color 0.2s' }}
                >
                  {/* Product Image */}
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].alt_text || product.name}
                      width={300}
                      height={200}
                      className="h-48 sm:h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="h-48 sm:h-48 w-full flex items-center justify-center bg-gray-100 dark:bg-gray-700"
                    >
                      <svg
                        className="h-8 w-8 text-gray-300 dark:text-gray-500"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M11 4h.01M11 12h.01M11 20h.01M19 10c0 8-8 8-8 8M5 10c0 8-8 8-8 8M7 4h.01M7 12h.01M7 20h.01M3 10c0 8 8 8 8 8M9 3v2m0 18v2m-6-3h6m5 0v2m0-18h6m-5 0V9m0 12h6m5 0V9m0 12h6m-5 0h6M3 13a9 9 0 1018 0 9 9 0 00-18 0z" />
                      </svg>
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {product.description || 'Sem descrição'}
                    </p>
                  </div>

                  {/* Product Footer */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-600">
                        {formatCurrency(product.price)}
                      </span>
                      {product.promotional_price && (
                        <span className="text-sm text-gray-400 line-through mr-1">
                          {formatCurrency(product.promotional_price)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-600">
                      Estoque: {product.stock_quantity > 0 ? 'Disponível' : 'Indisponível'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-8 border-t border-gray-200 dark:border-gray-700 py-8">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Lume Store</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loja virtual familiar com gestão de vendas e fiado.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Loja</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <a href="/produtos" className="underline hover:text-primary-600">Catálogo</a>
                </li>
                <li>
                  <a href="/carrinho" className="underline hover:text-primary-600">Carrinho</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Cliente</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <a href="/auth/login" className="underline hover:text-primary-600">Login</a>
                </li>
                <li>
                  <a href="/cadastro" className="underline hover:text-primary-600">Cadastro</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Jurídico</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <a href="/politica-de-privacidade" className="underline hover:text-primary-600">Privacidade</a>
                </li>
                <li>
                  <a href="/termos-de-servico" className="underline hover:text-primary-600">Termos</a>
                </li>
                <li>
                  <a href="/politica-de-trocas" className="underline hover:text-primary-600">Trocas</a>
                </li>
                <li>
                  <a href="/politica-de-cookies" className="underline hover:text-primary-600">Cookies</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Redes Sociais</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {/* Social links would go here */}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              2026 Lume Store. Todos os direitos reservados.
            </p>
            <div className="flex gap-2">
              {/* Social media icons would go here */}
              <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Feito com ❤️ para lojas familiares</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}