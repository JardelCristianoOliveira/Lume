"use server";

import { createServerClient, parseCookies } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '@/lib/utils';

// Schema for product validation
const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  price: z.number().min(0, 'Preço deve ser maior que zero'),
  promotional_price: z.number().optional().refine(
    val => val === undefined || val < (z.string().refine((val: string) => !isNaN(Number(val))) ? Number(val) : z.number()).refine(val => val >= 0),
    { message: 'Preço promocional deve ser menor que o preço normal' }
  ),
  stock_quantity: z.number().int().min(0, 'Quantidade deve ser maior ou igual a zero'),
  sku: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  allows_fiado: z.boolean().default(false),
});

export type ProductFormValues = z.infer<typeof productSchema>;

// Get server Supabase client
function getSupabase() {
  return parseCookies().then(createServerClient);
}

// List products with filters
export async function listProducts(filters: {
  status?: string;
  category_id?: string;
  search?: string;
  sortBy?: 'price' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}) {
  const supabase = await getSupabase();
  
  let query = supabase.from('products').select('*, categories(name)', { count: 'exact' });

  // Filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`);
  }

  // Sort
  const sortBy = filters.sortBy || 'name';
  const sortOrder = filters.sortOrder || 'asc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  if (filters.page && filters.pageSize) {
    const from = (filters.page - 1) * filters.pageSize;
    const to = from + filters.pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar produtos: ${error.message}`);
  }

  return {
    products: data || [],
    totalCount: count || 0,
  };
}

// Create product
export async function createProduct(values: ProductFormValues) {
  const supabase = await getSupabase();
  
  // Validate
  const validation = productSchema.safeParse(values);
  if (!validation.success) {
    throw new Error('Dados inválidos do produto');
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      ...validation.data,
      slug: validation.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar produto: ${error.message}`);
  }

  // Log audit
  await supabase.from('audit_logs').insert({
    action: 'product_create',
    entity_type: 'product',
    entity_id: data.id,
    user_id: (await supacle.getSession()).user.id,
    new_values: JSON.stringify(validation.data),
  });

  return { success: true, product: data };
}

// Update product
export async function updateProduct(id: string, values: Partial<ProductFormValues>) {
  const supabase = await getSupabase();
  
  // Validate partial
  const validation = productSchema.partial().safeParse({ id, ...values });
  if (!validation.success) {
    throw new Error('Dados inválidos para atualização');
  }

  const { data, error } = await supabase
    .from('products')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar produto: ${error.message}`);
  }

  return { success: true, product: data };
}

// Archive product (soft delete)
export async function archiveProduct(id: string) {
  const supabase = await getSupabase();
  
  const { error } = await supabase
    .from('products')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao arquivar produto: ${error.message}`);
  }

  return { success: true };
}

// Get product by ID
export async function getProduct(id: string) {
  const supabase = await getSupabase();
  
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Erro ao buscar produto: ${error.message}`);
  }

  return { success: true, product: data };
}