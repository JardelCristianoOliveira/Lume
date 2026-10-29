-- ============================================================
-- LUME STORE - Database Schema for Supabase PostgreSQL
-- ============================================================
-- This schema supports:
-- - Product catalog with inventory management
-- - Customer management with LGPD compliance
-- - Sales (à vista e fiado) with payment tracking
-- - Financial adjustments and audit logging
-- - Cookie consent and privacy preferences
-- - Row Level Security (RLS) for data isolation
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (user profiles linked to Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- 2. CATEGORIES - Product categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for category lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- ============================================================
-- 3. PRODUCTS - Product catalog
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  promotional_price NUMERIC(10, 2) CHECK (promotional_price IS NULL OR promotional_price < price),
  promotional_start DATE,
  promotional_end DATE,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sku TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT FALSE,
  allows_fiado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indices for product lookups
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);

-- ============================================================
-- 4. PRODUCT_IMAGES - Product images
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for product image lookups
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(is_primary);

-- ============================================================
-- 5. CUSTOMERS - Customer records (LGPD-compliant minimal data)
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE,
  notes TEXT, -- Observações comerciais objetivas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for customer lookups
CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ============================================================
-- 6. ORDERS - Sales orders (vistas e fiadas)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin who created
  total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_amount NUMERIC(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  fiado BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'pix', 'card', 'fiado', 'mixed')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'full', 'overpaid')),
  notes TEXT,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for order lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_sale_date ON orders(sale_date);
CREATE INDEX IF NOT EXISTS idx_orders_fiado ON orders(fiado);

-- ============================================================
-- 7. ORDER_ITEMS - Line items within orders
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  discount NUMERIC(10, 2) DEFAULT 0 CHECK (discount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for order item lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ============================================================
-- 8. SALES - Sales records (for fiado tracking separate from orders)
-- ============================================================
-- The sales table tracks individual sale transactions, especially
-- fiado sales, with detailed item breakdown for audit purposes.
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin who registered
  total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  fiado BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  payment_received NUMERIC(10, 2) DEFAULT 0 CHECK (payment_received >= 0),
  balance_due NUMERIC(10, 2) GENERATED ALWAYS AS (total - payment_received) STORED,
  due_date TIMESTAMP WITH TIME ZONE,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  closed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for sales lookups
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_fiado ON sales(fiado);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_due_date ON sales(due_date);

-- ============================================================
-- 9. SALE_ITEMS - Items within sales records
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  discount NUMERIC(10, 2) DEFAULT 0 CHECK (discount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for sale item lookups
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- ============================================================
-- 10. RECEIVABLES - Accounts receivable (fiado records)
-- ============================================================
-- This is the core table for tracking fiado/accounts receivable.
-- Each record represents a fiado agreement with a customer.
CREATE TABLE IF NOT EXISTS receivables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  original_amount NUMERIC(10, 2) NOT NULL CHECK (original_amount > 0),
  total_paid NUMERIC(10, 2) DEFAULT 0 CHECK (total_paid >= 0),
  balance_due NUMERIC(10, 2) GENERATED ALWAYS AS (original_amount - total_paid) STORED,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_aberto' CHECK (status IN ('em_aberto', 'vencendo_breve', 'vencido', 'quitado')),
  last_payment_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for receivables lookups
CREATE INDEX IF NOT EXISTS idx_receivables_customer ON receivables(customer_id);
CREATE INDEX IF NOT EXISTS idx_receivables_status ON receivables(status);
CREATE INDEX IF NOT EXISTS idx_receivables_due_date ON receivables(due_date);
CREATE INDEX IF NOT EXISTS idx_receivables_balance ON receivables(balance_due);

-- ============================================================
-- 11. PAYMENTS - Payment records (histórico de pagamentos)
-- ============================================================
-- Each payment record represents a received payment, integral or parcial.
-- Payments are never deleted - they preserve the financial history.
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  receivable_id UUID REFERENCES receivables(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT CHECK (payment_method IN ('cash', 'pix', 'card', 'fiado')),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  reference TEXT, -- Comprovante, transação ID, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for payments lookups
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_receivable ON payments(receivable_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- ============================================================
-- 12. FINANCIAL_ADJUSTMENTS - Adjustments, refunds, estornos
-- ============================================================
CREATE TABLE IF NOT EXISTS financial_adjustments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  receivable_id UUID REFERENCES receivables(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL, -- Can be positive (credit) or negative (debit)
  type TEXT NOT NULL CHECK (type IN ('refund', 'discount', 'adjustment', 'write-off', 'estorno')),
  reason TEXT NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('order', 'sale', 'receivable', 'payment')),
  reference_id UUID,
  authorized_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for financial adjustments lookups
CREATE INDEX IF NOT EXISTS idx_financial_adjustments_customer ON financial_adjustments(customer_id);
CREATE INDEX IF NOT EXISTS idx_financial_adjustments_reference ON financial_adjustments(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_financial_adjustments_created ON financial_adjustments(created_at);

-- ============================================================
-- 13. AUDIT_LOGS - Audit trail for sensitive operations
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g., 'product_create', 'payment_register', 'receivable_update'
  entity_type TEXT NOT NULL, -- e.g., 'product', 'sale', 'receivable', 'customer'
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================
-- 14. PRIVACY_REQUESTS - LGPD data subject requests
-- ============================================================
CREATE TABLE IF NOT EXISTS privacy_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin who processed
  request_type TEXT NOT NULL CHECK (request_type IN ('access', 'correction', 'deletion', 'information', 'portability')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  description TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMP WITH TIME ZONE,
  response TEXT,
  identity_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for privacy requests
CREATE INDEX IF NOT EXISTS idx_privacy_requests_customer ON privacy_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON privacy_requests(status);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_type ON privacy_requests(request_type);

-- ============================================================
-- 15. CONSENT_RECORDS - Consent tracking for data processing
-- ============================================================
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL, -- e.g., 'marketing', 'fiado', 'communication'
  consent BOOLEAN NOT NULL,
  given_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  expired_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Index for consent records
CREATE INDEX IF NOT EXISTS idx_consent_records_customer ON consent_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_purpose ON consent_records(purpose);

-- ============================================================
-- 16. COOKIE_PREFERENCES - Cookie consent preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS cookie_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  necessary BOOLEAN DEFAULT TRUE,
  analytics BOOLEAN DEFAULT FALSE,
  advertising BOOLEAN DEFAULT FALSE,
  preferences_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- 17. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
CREATE POLICY "Public can view own profile during signup" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage profiles" ON profiles
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- CATEGORIES POLICIES
-- ============================================================
CREATE POLICY "Public can view active categories" ON categories
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage categories" ON categories
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- PRODUCTS POLICIES
-- ============================================================
CREATE POLICY "Public can view published products" ON products
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage products" ON products
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- PRODUCT_IMAGES POLICIES
-- ============================================================
CREATE POLICY "Public can view product images" ON product_images
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage product images" ON product_images
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- CUSTOMERS POLICIES
-- ============================================================
CREATE POLICY "Customers can view own data" ON customers
  FOR SELECT USING (
    user_id IS NOT NULL AND user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage customers" ON customers
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- ORDERS POLICIES
-- ============================================================
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage orders" ON orders
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- SALES POLICIES
-- ============================================================
CREATE POLICY "Customers can view own sales" ON sales
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage sales" ON sales
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- RECEIVABLES POLICIES (CRITICAL - financial data isolation)
-- ============================================================
CREATE POLICY "Customers can view own receivables" ON receivables
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage receivables" ON receivables
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- PAYMENTS POLICIES
-- ============================================================
CREATE POLICY "Customers can view own payments" ON payments
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage payments" ON payments
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- FINANCIAL_ADJUSTMENTS POLICIES
-- ============================================================
CREATE POLICY "Customers can view own adjustments" ON financial_adjustments
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage adjustments" ON financial_adjustments
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- AUDIT_LOGS POLICIES
-- ============================================================
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- PRIVACY_REQUESTS POLICIES
-- ============================================================
CREATE POLICO "Customers can create own privacy request" ON privacy_requests
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage privacy requests" ON privacy_requests
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- CONSENT_RECORDS POLICIES
-- ============================================================
CREATE POLICY "Customers can manage own consent" ON consent_records
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- COOKIE_PREFERENCES POLICIES
-- ============================================================
CREATE POLICY "Users can view/manage own cookie preferences" ON cookie_preferences
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- 18. TRIGGERS FOR DATA INTEGRITY
-- ============================================================

-- Update updated_at timestamp on profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update balance_due on receivables after payment insert
CREATE OR REPLACE FUNCTION update_receivable_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate balance based on actual payments
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM payments
  WHERE receivable_id = NEW.id;

  NEW.total_paid = total_paid;
  NEW.balance_due = NEW.original_amount - NEW.total_paid;

  -- Update status based on balance
  IF NEW.balance_due <= 0 THEN
    NEW.status = 'quitado';
  ELSIF NEW.due_date < timezone('utc'::text, now()) THEN
    NEW.status = 'vencido';
  ELSIF NEW.due_date < timezone('utc'::text, now()) + INTERVAL '7 days' THEN
    NEW.status = 'vencendo_breve';
  ELSE
    NEW.status = 'em_aberto';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_receivable_balance_after_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_receivable_balance();

-- ============================================================
-- 19. SECURITY BEST PRACTICES
-- ============================================================
-- Note: Never store plain text passwords - Supabase Auth handles this
-- Never expose service_role key to frontend - use NEXT_PUBLIC_SUPABASE_ANON_KEY only
-- All financial operations use DECIMAL/NUMERIC, not FLOAT or REAL
-- All timestamps use TIMESTAMPTZ for consistent timezone handling
-- RLS policies ensure data isolation between users
-- Audit logs track all sensitive operations

-- ============================================================
-- END OF SCHEMA
-- ============================================================