import { useState } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { handleSupabaseError } from '@/lib/supabase/client';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error, data } = await signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            role: 'customer',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(handleSupabaseError(error, 'signup').error);
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Auto-login after signup or show message
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
    } catch (err) {
      setError('Erro inesperado durante o cadastro');
      setLoading(false);
    }
  };

  if (success) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
          Cadastro na Lume Store
        </h2>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-800 p-4 rounded mb-6 border border-red-200 dark:border-red-600">
            {error}
          </div>
        }}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome completo
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-mail
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              placeholder="(11) 9-1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Senha
            </label>
            <input
              type="password"
              placeholder="Crie uma senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded border border-gray-300 dark:border-gray-600 p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded border border-primary-600 px-4 py-3 text-white font-medium transition-colors hover:bg-primary-700 disabled:opacity-50 ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {loading
              ? 'Cadastrando...'
              : 'Criar conta'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Já tem uma conta?
            <a
              href="/auth/login"
              className="font-medium text-primary-600 hover:underline"
            >
              Faça login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}