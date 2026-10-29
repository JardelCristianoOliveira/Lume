import { useState, useEffect } from "react";
import Link from "next/link";
import { useSupabase } from "@/lib/supabase/provider";
import { listProducts, createProduct, updateProduct, archiveProduct, getProduct } from "@/actions/products";
import { formatCurrency } from "@/lib/utils";

export default function ProductsPage() {
  const { serverClient } = useSupabase();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    category_id: '',
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    pageSize: 10,
  });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    promotional_price: '',
    stock_quantity: '',
    sku: '',
    status: 'draft',
    allows_fiado: false,
  });
  const [formTitle, setFormTitle] = useState('Criar Produto');
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!serverClient) return;

    const loadProducts = async () => {
      try {
        const { data, totalCount } = await listProducts(filters);
        setProducts(data || []);
        // We don't have totalCount from the action directly, but we can set state
        setFilteredProducts(data || []);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        setError('Erro ao carregar produtos. Tente novamente.');
        setLoading(false);
      }
    };

    loadProducts();
  }, [serverClient, filters]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentProductId) {
        // Update product
        const result = await updateCurrentProduct();
        if (result.success) {
          setShowForm(false);
          setFormData(initialFormData);
          setFormTitle('Criar Produto');
          setCurrentProductId(null);
          loadProducts();
        }
      } else {
        // Create product
        const result = await createProduct(formData);
        if (result.success) {
          setShowForm(false);
          setFormData(initialFormData);
          setFormTitle('Criar Produto');
          setCurrentProductId(null);
          loadProducts();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  };

  const initialFormData = {
    name: '',
    description: '',
    category_id: '',
    price: '',
    promotional_price: '',
    stock_quantity: '',
    sku: '',
    status: 'draft',
    allows_fiado: false,
  };

  const updateCurrentProduct = async () => {
    if (!currentProductId) return { success: false };
    
    const result = await updateProduct(currentProductId, formData as any);
    return result;
  };

  const handleArchive = async (productId: string) => {
    try {
      const result = await archiveProduct(productId);
      if (result.success) {
        loadProducts();
        return true;
      }
      setError(result.error || 'Erro ao arquivar produto');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-primary-600">Lume Store</span>
          </div>
          <div className="flex items-center gap-2">
            {serverClient ? (
              <>
                <Link
                  href="/dashboard/novaproduto"
                  className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Novo Produto
                </Link>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Adicionar Produto
                </button>
              </>
            ) : null}
            <Link
              href="/auth/login"
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>

      <main className="p-6">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-800 p-4 rounded mb-4 border border-red-200 dark:border-red-600">
            {error}
          </div>
        )}

        {/* Product Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 max-w-2xl mx-auto border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{formTitle}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preço
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                    className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preço Promocional
                  </label>
                  <input
                    type="number"
                    name="promotional_price"
                    value={formData.promotional_price || ''}
                    onChange={(e) => setFormData({ ...formData, promotional_price: e.target.value })}
                    min="0"
                    className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Deixe em branco se não houver promoção
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estoque
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity || ''}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    min="0"
                    className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select
                  name="category_id"
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                >
                  <option value="">Nenhuma categoria</option>
                  {/* Categories would be loaded here */}
                </select>
                <select
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                >
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="allows_fiado"
                  checked={formData.allows_fiado}
                  onChange={(e) => setFormData({ ...formData, allows_fiado: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 w-4 h-4 focus:ring-primary-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Permite fiado
                </span>
              </div>

              <div>
                <button
                  type="submit"
                  className={`w-full rounded border border-primary-600 px-4 py-3 text-white font-medium transition-colors hover:bg-primary-700 ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : currentProductId ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-x-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Catálogo de Produtos ({filteredProducts.length})
              </h2>
              <div className="flex gap-2">
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="rounded border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                >
                  <option value="">Todos os status</option>
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Arquivado</option>
                </select>

                <select
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="rounded border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                >
                  <option value="">Pesquisar por nome...</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 animate-spin rounded-billax"></div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">
              <p>Nenhum produto encontrado</p>
              <p className="mt-2">Crie seu primeiro produto</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Nome
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Categoria
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Preço
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Estoque
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Status
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                        {product.name}
                      </td>
                      <td className="p-3 text-sm text-gray-500 dark:text-gray-400">
                        {product.categories?.name || '—'}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="p-3 text-right">
                        <span className={product.stock_quantity <= 3 ? 'text-error-600 font-medium' : 'text-gray-500'}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={
                          product.status === 'published' ? 'text-success-600' :
                          product.status === 'archived' ? 'text-gray-500' :
                          'text-warning-600'
                        }>
                          {product.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {currentProductId === product.id ? null : (
                            <>
                              <button
                                onClick={() => setCurrentProductId(product.id)}
                                className="text-primary-600 hover:underline text-sm"
                                title="Editar"
                              >
                                Editar
                              </button>
                            </>
                          )}
                          {currentProductId === product.id ? (
                            <>
                              <button
                                onClick={() => setCurrentProductId(null)}
                                className="text-gray-500 hover:underline text-sm"
                                title="Cancelar"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : null}
                          <button
                            onClick={() => handleArchive(product.id)}
                            className="text-error-600 hover:underline text-sm"
                            title="Arquivar"
                            disabled={product.status === 'archived'}
                          >
                            {product.status === 'archived' ? 'Arquivado' : 'Arquivar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        )
      </main>
    </div>
  );
}