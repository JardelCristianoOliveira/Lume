import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Product CRUD', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('listProducts', () => {
    it('should list published products', async () => {
      const { listProducts } = await import('@/actions/products')
      
      const result = await listProducts({
        status: 'published',
        sortBy: 'name',
        sortOrder: 'asc'
      })
      
      expect(result).toBeDefined()
      expect(result.products).toBeDefined()
    })

    it('should filter products by category', async () => {
      const { listProducts } = await import('@/actions/products')
      
      const result = await listProducts({
        category_id: ''
      })
      
      expect(result).toBeDefined()
    })
  })

  describe('createProduct', () => {
    it('should create a product with valid data', async () => {
      const { createProduct } = await import('@/actions/products')
      
      const result = await createProduct({
        name: 'Produto de Teste',
        description: 'Descrição do produto de teste',
        price: 29.90,
        stock_quantity: 10,
        status: 'published' as const
      })
      
      expect(result.success).toBe(true)
    })

    it('should fail with invalid price', async () => {
      const { createProduct } = await import('@/actions/products')
      
      const result = await createProduct({
        name: 'Produto',
        price: -10, // Invalid: negative price
        stock_quantity: 5
      })
      
      expect(result.success).toBe(false)
    })

    it('should fail with zero stock check', async () => {
      const { createProduct } = await import('@/actions/products')
      
      const result = await createProduct({
        name: 'Produto',
        price: 10.00,
        stock_quantity: -5 // Invalid: negative stock
      })
      
      expect(result.success).toBe(false)
    })
  })

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const { updateProduct } = await import('@/actions/products')
      
      const result = await updateProduct('test-product-id', {
        name: 'Nome Atualizado'
      })
      
      expect(result.success).toBe(true)
    })
  })

  describe('archiveProduct', () => {
    it('should archive a product', async () => {
      const { archiveProduct } = await import('@/actions/products')
      
      const result = await archiveProduct('test-product-id')
      
      expect(result.success).toBe(true)
    })
  })
})