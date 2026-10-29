export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-8 border border-gray-200 dark:border-gray-700 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Autenticação Concluída
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Você foi autenticado com sucesso. Você será redirecionado em instantes.
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          <a href="/" rel="noopener noreferrer">Voltar para a Lume Store</a>
        </p>
      </div>
    </div>
  );
}