# Lume Store - Complete Application README

## Overview

Lume Store is a complete web application for a small family store, featuring:
- A public virtual store where customers can browse products, create accounts, view orders, and make purchases
- A private administrative dashboard for the store owner to manage products, customers, sales, fiados (credit), and payments
- LGPD (Lei Geral de Proteção de Dados) compliance for Brazilian data protection
- Liquid Glass design system with accessibility focus
- Full database persistence with Supabase PostgreSQL
- Row Level Security (RLS) for data isolation between users

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Supabase Configuration](#supabase-configuration)
4. [Environment Variables](#environment-variables)
5. [Creating the First Administrator](#creating-the-first-administrator)
6. [Running the Application](#running-the-application)
7. [Available Scripts](#available-scripts)
8. [Project Structure](#project-structure)
9. [Security Checklist](#security-checklist)
10. [LGPD Compliance](#lgpd-compliance)
11. [Deployment](#deployment)

## Prerequisites

- Node.js v18+ (v26.13.0 tested, but v18+ recommended)
- pnpm v11+ (or npm/yarn)
- Supabase project account
- Modern browser (Chrome, Firefox, Safari, Edge)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd lime-store
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up Supabase

Follow the steps in the [Supabase Configuration](#supabase-configuration) section below.

### 4. Configure environment variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Then edit `.env` with your Supabase credentials and settings.

## Supabase Configuration

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key

### 2. Database schema

Execute the SQL schema file `supabase/schema.sql` in your Supabase SQL editor:

```sql
-- Execute all SQL commands from the schema.sql file
-- This creates all tables, RLS policies, and triggers
```

The schema includes:
- `profiles` - User profiles linked to Supabase Auth
- `categories` - Product categories
- `products` - Product catalog with inventory management
- `product_images` - Product images
- `customers` - Customer records (LGPD-compliant minimal data)
- `orders` - Sales orders (à vista and fiado)
- `order_items` - Line items within orders
- `sales` - Sales records for fiado tracking
- `sale_items` - Items within sales records
- `receivables` - Accounts receivable (fiado records) - **CORE MODULE**
- `payments` - Payment records (historical, never deleted)
- `financial_adjustments` - Refunds, adjustments, estornos
- `audit_logs` - Audit trail for sensitive operations
- `privacy_requests` - LGPD data subject requests
- `consent_records` - Consent tracking
- `cookie_preferences` - Cookie consent preferences

### 3. Enable Row Level Security (RLS)

The schema automatically enables RLS on all tables. The included policies ensure:

- **Customers** can only view their own data (profile, orders, receivables, payments)
- **Admins** have full access to manage the store
- **Public** can only view published products and categories
- Financial data is isolated between users

### 3. Auth Configuration

1. Go to Supabase Dashboard → Authentication → Settings
2. Configure the following:
   - Site URL: Your deployment URL (e.g., `https://lume-store.vercel.app`)
   - Redirect URLs: Add `http://localhost:3000/auth/callback` for development
   - Enable Email authentication
3. Go to Authentication → Providers and enable email sign-in if desired

### 4. Run migrations

The schema.sql file includes all necessary migrations. Supabase automatically version-controls your database schema.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required Supabase variables (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Application settings
NEXT_PUBLIC_APP_NAME=Lume Store
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# Feature flags
NEXT_PUBLIC_ENABLE_FIADO=true
NEXT_PUBLIC_ENABLE_COOKIE_CONSENT=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_WHATSAPP_REMINDER=true

# Payment settings
NEXT_PUBLIC_ENABLE_ONLINE_PAYMENT=false
NEXT_PUBLIC_DEFAULT_FIADO_DAYS=30

# Security
NEXT_PUBLIC_RATE_LIMIT_WINDOW=900
NEXT_PUBLIC_RATE_LIMIT_MAX=100

# Optional: Uncomment and add when using external services
# NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
# NEXT_PUBLIC_META_PIXEL_ID=XXXXXXXXXXXXXXX

# NOTE: Never add SERVICE_ROLE_KEY to this file or expose it to the browser!
```

## Creating the First Administrator

**CRITICAL: Never use a default password or public endpoint to create administrators.**

### Method 1: Via Supabase Dashboard (Recommended for initial setup)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication → Users**
3. Click **Add User**
4. Enter the email address of the store owner
5. Click **Send invitation** - the user will receive an email to set their password
6. Once the user has set their password and logged in

### Method 2: Via SQL (Direct database insertion)

Execute this SQL in the Supabase SQL editor to create the first admin user:

```sql
-- 1. Create the user in auth.users (this uses the admin API)
-- Note: This requires the service_role key, so run in SQL editor with caution

-- 2. Then create the profile with admin role
INSERT INTO profiles (id, role, full_name, phone, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- Use the user's UUID from auth
  'admin',
  'Proprietária da Loja',   -- Replace with actual name
  '(11) 9-9999-9999',       -- Replace with actual phone
  timezone('utc'::text, now()),
  timezone('utc'::text, now())
);
```

**Important:** The above SQL assumes you have the user's UUID from Supabase Auth. The proper way is:

1. Create a user in the Supabase Auth dashboard
2. Get their `id` (UUID)
3. Run the INSERT INTO profiles command with that UUID

### Method 3: Via signup flow

1. Visit `http://localhost:3000/cadastro` (development) or your deployment URL `/cadastro`
2. Complete the registration form
3. After registration, the user will have the `customer` role by default
4. As the owner, you can update their profile role to `admin` through the dashboard or SQL

**To change a user's role to admin:**

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'USER_UUID_HERE';
```

## Running the Application

### Development mode

```bash
pnpm dev
```

This starts the Next.js development server with Turbopack. The application will be available at `http://localhost:3000`.

### Production build

```bash
pnpm build
pnpm start
```

### Linting

```bash
pnpm lint
```

### Tests

```bash
# Run Vitest unit tests
npx vitest run

# Note: Tests may have environment compatibility issues with Node v26,
# but the test files are properly structured for when the environment is updated.
```

## Project Structure

```
lime-store/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── auth/         # Login/Signup pages
│   │   ├── dashboard/    # Admin dashboard
│   │   ├── cliente/      # Customer profile page
│   │   ├── legal/        # Legal pages (privacy, terms, etc.)
│   │   ├── products/     # Product detail page
│   │   ├── carrinho/     # Shopping cart page
│   │   └── page.tsx      # Home page
│   ├── actions/          # Server Actions (products, receivables)
│   ├── lib/              # Utilities and helpers
│   │   ├── supabase/     # Supabase clients and providers
│   │   └── utils.ts      # Format currency, dates, etc.
│   ├── tests/            # Vitest test files
│   └── components/       # Reusable React components
├── supabase/             # Supabase schema and configs
├── .env.example          # Environment variables template
├── tailwind.config.ts    # Tailwind CSS configuration
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies and scripts
└── README.md             # This file

### Key Directories

- `src/app/` - Next.js 13+ App Router pages and layouts
- `src/actions/` - Server Actions for CRUD operations (products, receivables)
- `src/lib/supabase/` - Supabase client configuration (browser and server clients)
- `supabase/` - SQL schema, RLS policies, and triggers
- `src/tests/` - Vitest test files for critical functionality

## Security Checklist

### Authentication & Authorization

- [ ] Supabase Auth configured with email/password
- [ ] No default passwords or admin endpoints
- [ ] RLS policies implemented on all tables
- [ ] Profile role restricted to 'admin' or 'customer'
- [ ] Authorization checked on server-side for all operations

### Data Protection

- [ ] Financial data uses NUMERIC(10,2), not FLOAT
- [ ] Timestamps use TIMESTAMPTZ for timezone consistency
- [ ] Audit logs track all sensitive operations
- [ ] No plain text password storage (Supabase Auth handles this)
- [ ] Balance calculated from actual payments, not manual input

### Frontend Security

- [ ] Never expose service_role key to browser
- [ ] Environment variables use NEXT_PUBLIC_ prefix only for safe vars
- [ ] Input validation with Zod schemas
- [ ] XSS prevention through proper escaping
- [ ] CSRF protection via Supabase Auth cookies

### API Security

- [ ] All financial operations use database transactions
- [ ] Prevent double payments with proper locking
- [ ] Payment amounts validated against actual balances
- [ ] Estornos/audit logs preserve financial history
- [ ] No endpoint creates administrators publicly

### Dependency Security

- [ ] Dependencies updated and verified
- [ ] Regular security scans recommended
- [] No known vulnerabilities in installed packages

## LGPD Compliance

### Data Protection Principles

- [ ] **Coleta apenas do necessário**: Only collect data required for operations
- [ ] **Finalidades específicas**: Each data treatment has a defined purpose and legal basis
- [ ] **Adequação**: Data processing aligned with the finality declared
- [ ] **Qualidade**: Data kept up to date and accurate
- [ ] **Transparência**: Clear privacy policy available to users
- [ ] **Segurança**: Appropriate technical and administrative measures
- [ ] **Prevenção**: Measures to prevent unauthorized access or loss

### User Rights (Art. 18, LGPD)

- [ ] **Confirmação**: User can confirm existence of treatment
- [ ] **Acesso**: User can access their data
- [ ] **Correção**: User can correct incomplete/incorrect data
- [ ] **Anonimização/Block/Eliminação**: User can request data elimination (with legal limitations)
- [ ] **Portabilidade**: User can receive data in structured format
- [ ] **Oposição**: User can oppose treatment based on legitimate interest
- [ ] **Revogação de consentimento**: User can withdraw consent

### Privacy Policy Components (Included)

- [ ] Controller identification
- [ ] Contact channels
- [ ] Collected data types
- [ ] Treatment purposes with legal bases
- [ ] Sharing with providers (minimal, necessary only)
- [ ] Storage locations and retention periods
- [ ] Data subject rights exercise instructions
- [ ] International transfer information (none by default)
- [ ] Reclamation procedures

### Cookie Policy (Included)

- [ ] Strictly necessary cookies (session, auth)
- [ ] Optional analytics cookies (require consent)
- [ ] No advertising cookies by default
- [ ] Consent panel with equal-access options
- [ ] Option to reject optional cookies
- [ ] Ability to change decision later
- [ ] Cookie preferences recorded and respected

### Documents Provided

- [ ] Política de Privacidade (with [PLACEHOLDER] fields to fill)
- [ ] Termos de Serviço (with [PLACEHOLDER] fields to fill)
- [ ] Política de Trocas e Devoluções (consumer law compliant)
- [ ] Política de Cookies
- [ ] All documents have [PREENCHER] markers for data to be confirmed

## Deployment

### Vercel Deployment

1. **Create a Vercel project**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository

2. **Add Environment Variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`
   - **Important**: Remove `NEXT_PUBLIC_` prefix from variables that shouldn't be exposed, or keep as-is for Next.js compatibility

3. **Set up Domain (optional)**
   - Add your custom domain in Vercel settings
   - Configure DNS records if needed

4. **Configure Supabase for Production**
   - Update the `site_url` in Supabase Authentication settings
   - Add your production URL to redirect URLs
   - Enable HTTPS-only mode

5. **Build and Deploy**
   ```bash
   pnpm build
   # Vercel will automatically deploy on push to main branch
   ```

### Supabase Production Checklist

- [ ] Custom domain configured in Supabase
- [ ] HTTPS enforced (automatic with Supabase)
- [ ] Rate limiting configured (already in code)
- [ ] Email provider set up for password resets
- [ ] Automatic backups enabled (Supabase feature)
- [ ] Point-in-time recovery configured
- [ ] Monitoring set up for audit logs

### Netlify Deployment (Alternative)

1. Build the project: `pnpm build`
2. Deploy the `out` directory to Netlify
3. Set environment variables in Netlify dashboard
4. Configure the same Supabase settings as Vercel

## Known Limitations & Trade-offs

### Current Limitations

1. **Node.js compatibility**: Vitest v5.x has compatibility issues with Node.js v26.13.0. Test files are structured correctly but may need vitest version update or environment adjustment.

2. **No real payment gateway**: Currently, `NEXT_PUBLIC_ENABLE_ONLINE_PAYMENT=false`. When integrating a payment gateway (MercadoPago, Stripe, etc.), update this flag and implement the payment flow.

3. **Fiado reminders**: The WhatsApp button prepares the message but doesn't send it automatically (requires Twilio or similar integration for actual sending).

4. **Limited LGPD automation**: The system tracks consent and requests but doesn't fully automate data subject request fulfillment yet.

5. **No image upload in this version**: The schema includes product_images table, but the file upload component needs Supabase Storage configuration.

### Trade-offs Made

- **Simplified auth flow**: Using Supabase Auth handles most authentication complexity, but means less control over custom authentication logic.
- **Server-side only business logic**: Critical financial operations happen on the server via Supabase, reducing client-side manipulation risk.
- **Minimal dependencies**: Chosen stable, well-maintained dependencies over cutting-edge packages that might have compatibility issues.
- **Liquid Glass design over pure Tailwind**: Added some CSS for the glass effect while maintaining Tailwind for the rest of the styling.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contacts

For support or questions about Lume Store:
- **E-mail**: [Seu e-mail aqui]
- **GitHub**: [Seu GitHub aqui]

---

*Generated on: [DATA ATUAL]*
*Versão: 1.0*