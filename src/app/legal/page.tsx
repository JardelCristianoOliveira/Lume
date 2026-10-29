export default function LegalPages() {
  return (
    <div className="min-h-screen bg-background p-6">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-primary-600">Lume Store</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Link
              href="/termos-de-servico"
              className={({ href }) => {
                // This is a simplified approach - in production would use useLocation
                return 'hover:text-primary-600 transition-colors'
              }}
            >
              Termos de Serviço
            </Link>
            <span className="mx-2">|</span>
            <Link
              href="/politica-de-privacidade"
              className={({ href }) => {
                return 'hover:text-primary-600 transition-colors'
              }}
            >
              Política de Privacidade
            </Link>
            <span className="mx-2">|</span>
            <Link
              href="/politica-de-trocas"
              className={({ href }) => {
                return 'hover:text-primary-600 transition-colors'
              }}
            >
              Política de Trocas
            </Link>
            <span className="mx-2">|</span>
            <Link
              href="/politica-de-cookies"
              className={({ href }) => {
                return 'hover:text-primary-600 transition-colors'
              }}
            >
              Política de Cookies
            </Link>
          </div>
        </div>
      </nav>

      <main className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Selecione uma página jurídica
        </h1>
        <div className="space-y-4">
          <div className="p-4 rounded border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors cursor-pointer">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Termos de Serviço</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Direitos e responsabilidades do uso da plataforma
            </p>
          </div>
          <div className="p-4 rounded border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors cursor-pointer">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Política de Privacidade</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Como coletamos, usamos e protegemos seus dados
            </p>
          </div>
          <div className="p-4 rounded border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors cursor-pointer">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Política de Trocas</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Direitos e procedimentos de devolução e reembolso
            </p>
          </div>
          <div className="p-4 rounded border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors cursor-pointer">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Política de Cookies</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Como utilizamos cookies e tecnologias similares
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}