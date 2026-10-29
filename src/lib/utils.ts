/**
 * Utility functions for Lume Store
 * 
 * Formatting, validation, and helper functions
 * used across the application.
 */

// Format currency in Brazilian Real
export function formatCurrency(
  value: number | string,
  options: { 
    locale?: string; 
    style?: 'currency'; 
    currency?: 'BRL' | 'USD' | 'EUR'; 
  } = {}
): string {
  const locale = options.locale || 'pt-BR';
  const style = options.style || 'currency';
  const currency = options.currency || 'BRL';
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat(locale, {
    style,
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

// Format date in Brazilian format
export function formatDate(date: string | Date, options: { short?: boolean } = {}): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const short = options.short !== false;
  
  if (isNaN(dateObj.getTime())) return 'Data inválida';
  
  const optionsFormat: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(short ? { hour: '2-digit', minute: '2-digit' } : {}),
  };
  
  return new Intl.DateTimeFormat('pt-BR', optionsFormat).format(dateObj);
}

// Check if value is valid number
export function isValidNumber(value: any): boolean {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

// Check if product has stock available
export function hasStock(stock: number, quantity: number = 1): boolean {
  return stock >= quantity;
}

// Calculate installment value
export function calculateInstallment(total: number, installments: number): number {
  if (installments <= 0 || !isValidNumber(total)) return 0;
  return Math.round((total / installments) * 100) / 100;
}

// Check if installment is overdue
export function isOverdue(dueDate: string | Date): boolean {
  const due = new Date(dueDate);
  const now = new Date();
  return due < now && isFinite(due.getTime());
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Deep clone object (for safe data copying)
export function deepClone(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(deepClone);
  const cloned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    cloned[key] = deepClone(obj[key]);
  }
  return cloned;
}

export default { formatCurrency, formatDate, isValidNumber, hasStock, calculateInstallment, isOverdue, debounce, deepClone };