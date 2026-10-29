import { useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/lib/supabase/provider";
import { listProducts as listCategories } from "@/actions/products";
import { formatCurrency } from "@/lib/utils";

export default function NewProductPage() {
  const { serverClient } = useSupabase();
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    promotional_price: '',
    stock_quantity: '',
    sku: '',
    status: 'published',
    allows_fiado: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    if (!serverClient) return;

    const loadCategories = async () => {
      try {
        const { data, error } = await serverClient
          .from('categories')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
      }
    };

    loadCategories();
  }, [serverClient]);

  const handleInputChange = (e: React.ChangeEvent) => {
    const { name, value, type, checked } = e.target;
    setProductForm({
      ...productForm,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!productForm.name || productForm.name.trim() === '') {
        setError('Nome do produto é obrigatório');
        setLoading(false);
        return;
      }

      if (!isValidNumber(productForm.price) || Number(productForm.price) <= 0) {
        setError('Preço deve ser maior que zero');
        setLoading(false);
        return;
      }

      const productData = {
        name: productForm.name.trim(),
        description: productForm.description || '',
        category_id: productForm.category_id || null,
        price: Number(productForm.price),
        promotional_price: productForm.promotional_price ? Number(productForm.promotional_price) : null,
        stock_quantity: productForm.stock_quantity ? Math.max(0, Number(productForm.stock_quantity)) : 0,
        sku: productForm.sku || null,
        status: productForm.status || 'published',
        allows_fiado: productForm.allows_fiado || false,
      };

      // Create product action
      const { success } = await createProductAction(productData);

      if (success) {
        // Reset form
        setProductForm({
          name: '',
          description: '',
          category_id: '',
          price: '',
          promotional_price: '',
          stock_quantity: '',
          sku: '',
          status: 'published',
          allows_fiado: false,
        });
        setLoading(false);
        // Navigate back or show success
        setTimeout(() => {
          window.location.href = '/dashboard/produtos';
        }, 1000);
      } else {
        setError('Erro ao criar produto. Verifique os dados.');
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao criar produto');
      setLoading(false);
    }
  };

  const createProductAction = async (productData: any) => {
    try {
      const result = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.error || 'Erro ao criar produto');
      }

      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  const isValidNumber = (value: any): boolean => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-primary-600">Lume Store</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/produtos"
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 12a1 1 0 011-1h12a1 1 0 010 2H5a1 1 0 01-1-1zM3 7a1 1 0 011-1h2a1 1 0 010 1h14a1 1 0 010 1h-2a1 1 0 01-1-1V7zm10.5 4.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-7.5 0a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM3 12a1 1 0 011-1h12a1 1 0 010 2H5a1 1 0 01-1-1zM3 7a1 1 0 011-1h2a1 1 0 010 1h14a1 1 0 010 1h-2a1 1 0 01-1-1V7zm0 4a1 1 0 012 0v2a1 1 0 01-2 0v-2z"/>
              </svg>
              Produtos
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Novo Produto</h2>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 p-4 rounded mb-4 border border-red-200 dark:border-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Produto
              </label>
              <input
                type="text"
                name="name"
                value={productForm.name}
                onChange={handleInputChange}
                required
                maxLength={100}
                className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                placeholder="Ex: Camiseta de Algodão"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                name="description"
                value={productForm.description || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                placeholder="Descreva as características do produto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoria
                </label>
                <select
                  name="category_id"
                  value={productForm.category_id}
                  onChange={handleInputChange}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={productForm.status}
                  onChange={handleInputChange}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                >
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preço (R$)
                </label>
                <input
                  type="number"
                  name="price"
                  value={productForm.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preço Promocional (R$)
                </label>
                <input
                  type="number"
                  name="promotional_price"
                  value={productForm.promotional_price || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                  placeholder="Deixe em branco se não houver promoção"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Opcional - deve ser menor que o preço normal
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
                  value={productForm.stock_quantity}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={productForm.sku || ''}
                  onChange={handleInputChange}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="allows_fiado"
                checked={productForm.allows_fiado}
                onChange={handleInputChange}
                className="rounded border-gray-300 dark:border-gray-600 w-4 h-4 focus:ring-primary-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Permitir venda fiada deste produto
              </span>
            </div>

            <button
              type="submit"
              className={`w-full rounded border border-primary-600 px-4 py-3 text-white font-medium transition-colors hover:bg-primary-700 ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}