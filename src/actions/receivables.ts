/**
 * Receivables Actions - Fiado/Accounts Receivable Management
 * 
 * This module handles:
 * - Registering sales as fiado
 * - Recording payments (partial/full)
 * - Calculating automatic balances
 * - Tracking due dates and status
 * - Generating reminders
 */

"use server";

import { createServerClient, parseCookies } from '@/lib/supabase/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency, isOverdue } from '@/lib/utils';

// Schema for creating a receivable (fiado)
const createReceivableSchema = z.object({
  customer_id: z.string().uuid('Cliente inválido'),
  sale_id: z.string().uuid('Venda inválida').optional(),
  original_amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  due_date: z.string().refine((val) => new Date(val) > new Date(), {
    message: 'Data de vencimento deve ser no futuro',
  }),
  notes: z.string().optional(),
});

// Schema for registering a payment
const registerPaymentSchema = z.object({
  receivable_id: z.string().uuid('Registro de recebível inválido'),
  amount: z.number().min(0.01, 'Valor do pagamento deve ser maior que zero'),
  payment_method: z.enum(['cash', 'pix', 'card', 'fiado']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// Schema for registering a sale with fiado
const createSaleWithFiadoSchema = z.object({
  customer_id: z.string().uuid('Cliente inválido'),
  product_ids: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1, 'Quantidade deve ser no mínimo 1'),
  })).nonempty('Selecione pelo menos um produto'),
  notes: z.string().optional(),
});

export type CreateReceivableFormValues = z.infer<typeof createReceivableSchema>;
export type RegisterPaymentFormValues = z.infer<typeof registerPaymentSchema>;
export type CreateSaleWithFiadoFormValues = z.infer<typeof createSaleWithFiadoSchema>;

// Get server Supabase client
function getSupabase() {
  return parseCookies().then(createServerClient);
}

// Create a new receivable (fiado)
export async function createReceivable(values: CreateReceivableFormValues) {
  const supabase = await getSupabase();
  
  // Validate
  const validation = createReceivableSchema.safeParse(values);
  if (!validation.success) {
    throw new Error('Dados inválidos para criação de fiado');
  }

  const { data, error } = await supabase
    .from('receivables')
    .insert({
      ...validation.data,
      id: uuidv4(),
      status: 'em_aberto',
      balance_due: validation.data.original_amount, // Will be updated by trigger
      total_paid: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar fiado: ${error.message}`);
  }

  // Log audit
  await supabase.from('audit_logs').insert({
    action: 'receivable_create',
    entity_type: 'receivable',
    entity_id: data.id,
    user_id: (await supabase.auth.getSession()).user.id,
    new_values: JSON.stringify(validation.data),
  });

  return { success: true, receivable: data };
}

// Register a payment for a receivable
export async function registerPayment(values: RegisterPaymentFormValues) {
  const supabase = await getSupabase();
  
  // Validate
  const validation = registerPaymentSchema.safeParse(values);
  if (!validation.success) {
    throw new Error('Dados inválidos para registro de pagamento');
  }

  // Start a transaction - insert payment and update receivable
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      ...validation.data,
      id: uuidv4(),
      payment_date: new Date().toISOString(),
    });

  if (paymentError) {
    throw new Error(`Erro ao registrar pagamento: ${paymentError.message}`);
  }

  // Update receivable balance - this will be handled by the trigger
  // But we also need to recalculate manually in case trigger doesn't fire properly
  const { data: receivable, error: recvError } = await supabase
    .from('receivables')
    .select('*, customers(name)')
    .eq('id', validation.data.receivable_id)
    .single();

  if (recvError) {
    throw new Error(`Erro ao atualizar fiado: ${recvError.message}`);
  }

  // Recalculate total paid
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('amount')
    .eq('receivable_id', validation.data.receivable_id);

  if (paymentsError) throw paymentsError;

  const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const balanceDue = receivable.original_amount - totalPaid;

  // Update status
  let newStatus = 'em_aberto';
  if (balanceDue <= 0) {
    newStatus = 'quitado';
  } else if (isOverdue(receivable.due_date)) {
    newStatus = 'vencido';
  } else if (receivable.due_date < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()) {
    newStatus = 'vencendo_breve';
  }

  await supabase
    .from('receivables')
    .update({ 
      total_paid: totalPaid,
      balance_due: balanceDue,
      status: newStatus,
      last_payment_at: new Date().toISOString(),
    })
    .eq('id', validation.data.receivable_id);

  // Log audit
  await supabase.from('audit_logs').insert({
    action: 'payment_register',
    entity_type: 'payment',
    entity_id: validation.data.receivable_id,
    user_id: (await supabase.auth.getSession()).user.id,
    new_values: JSON.stringify({
      amount: validation.data.amount,
      method: validation.data.payment_method,
      new_balance: balanceDue,
    }),
  });

  return { 
    success: true, 
    receivable: { ...receivable, total_paid: totalPaid, balance_due: balanceDue, status: newStatus }
  };
}

// Create a sale with fiado
export async function createSaleWithFiado(values: CreateSaleWithFiadoFormValues) {
  const supabase = await getSupabase();
  
  // Validate
  const validation = createSaleWithFiadoSchema.safeParse(values);
  if (!validation.success) {
    throw new Error('Dados inválidos para venda com fiado');
  }

  // Start transaction
  const transactionId = uuidv4();
  
  try {
    // 1. Create the sale record
    const { error: saleError } = await supabase
      .from('sales')
      .insert({
        customer_id: validation.data.customer_id,
        user_id: (await supabase.auth.getSession()).user.id,
        total: 0, // Will be calculated
        fiado: true,
        status: 'open',
        payment_status: 'partial',
      });

    if (saleError) throw saleError;

    // 2. Create the receivable
    const { error: receivableError } = await supabase
      .from('receivables')
      .insert({
        id: uuidv4(),
        customer_id: validation.data.customer_id,
        sale_id: '', // Will be updated later
        original_amount: 0, // Will be calculated from items
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        status: 'em_aberto',
      });

    if (receivableError) throw receivableError;

    // 3. Create order items and update product stock
    for (const item of validation.data.product_ids) {
      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.product_id)
        .single();

      if (productError) throw productError;

      // Check stock
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Estoque insuficiente para: ${product.name}. Disponível: ${product.stock_quantity}`);
      }

      // Create order item
      const unitPrice = product.price;
      const totalPrice = unitPrice * item.quantity;

      await supabase.from('order_items').insert({
        id: uuidv4(),
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      });

      // Update product stock
      await supabase
        .from('products')
        .update({ stock_quantity: product.stock_quantity - item.quantity })
        .eq('id', item.product_id);
    }

    // 4. Calculate total and update sale
    // We need to get the calculated total from the items
    const { data: allItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('product_id', ''); // This needs fixing

    return { 
      success: true, 
      message: 'Venda fiada registrada com sucesso',
      transactionId
    };
  } catch (err) {
    // If anything fails, we need to roll back - but Supabase doesn't have distributed transactions
    // The application logic should handle this - if we get here, something went wrong
    throw new Error(`Erro ao criar venda fiada: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
  }
}

// Get receivables with filters
export async function getReceivables(filters: {
  status?: string;
  customer_id?: string;
  search?: string;
  period?: 'today' | 'this-month' | 'overdue' | 'upcoming';
}) {
  const supabase = await getSupabase();
  
  let query = supabase.from('receivables').select(`
    *,
    customers(name),
    sales(*)
  `);

  // Filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }
  if (filters.search) {
    query = query.or(`customers.name.ilike.%${filters.search}%`);
  }

  // Period filters
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const todayEnd = new Date(now.setHours(23, 59, 59, 999)).toISOString();
  
  // Upcoming (within 7 days)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // We'll apply period filtering in the application layer since it's complex SQL

  query = query.order('due_date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar fiados: ${error.message}`);
  }

  // Apply period filters in application
  let filtered = data || [];

  if (filters.period === 'today') {
    filtered = filtered.filter(r => r.due_date >= todayStart && r.due_date <= todayEnd);
  } else if (filters.period === 'this-month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    filtered = filtered.filter(r => r.due_date >= monthStart && r.due_date <= monthEnd);
  } else if (filters.period === 'overdue') {
    filtered = filtered.filter(r => isOverdue(r.due_date) && r.status !== 'quitado');
  } else if (filters.period === 'upcoming') {
    filtered = filtered.filter(r => 
      r.due_date > now && r.due_date <= sevenDaysFromNow && r.status !== 'quitado'
    );
  }

  return { receivables: filtered };
}

// Get receivable details with payment history
export async function getReceivableDetails(receivableId: string) {
  const supabase = await getSupabase();
  
  const { data: receivable, error: recvError } = await supabase
    .from('receivables')
    .select(`
      *,
      customers(name, phone),
      sales(*)
    `)
    .eq('id', receivableId)
    .single();

  if (recvError) {
    throw new Error(`Erro ao buscar detalhes do fiado: ${recvError.message}`);
  }

  // Get payment history
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('receivable_id', receivableId)
    .order('payment_date', { ascending: false });

  if (paymentsError) throw paymentsError;

  return { 
    receivable, 
    payments: payments || [],
    total_paid: (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0),
  };
}