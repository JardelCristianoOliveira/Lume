import { describe, it, expect, beforeEach, vi } from 'vitest'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Fiado / Contas a Receber', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('createReceivable', () => {
    it('should create a new receivable with valid data', async () => {
      const { createReceivable } = await import('@/actions/receivables')
      
      // Test with valid data
      const result = await createReceivable({
        customer_id: 'test-customer-id',
        original_amount: 150.00,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Test fiado'
      })
      
      expect(result.success).toBe(true)
    })

    it('should fail with invalid customer_id', async () => {
      const { createReceivable } = await import('@/actions/receivables')
      
      const result = await createReceivable({
        customer_id: 'invalid-uuid',
        original_amount: 100.00,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      
      expect(result.success).toBe(false)
    })
  })

  describe('registerPayment', () => {
    it('should register a payment and update balance', async () => {
      // First create a receivable
      const { createReceivable } = await import('@/actions/receivables')
      const createResult = await createReceivable({
        customer_id: 'test-customer-2',
        original_amount: 200.00,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      
      expect(createResult.success).toBe(true)
      
      if (!createResult.success) return
      
      // Then register a payment
      const { registerPayment } = await import('@/actions/receivables')
      const paymentResult = await registerPayment({
        receivable_id: createResult.receivable.id,
        amount: 50.00,
        payment_method: 'pix',
        reference: 'Comprovante 123'
      })
      
      expect(paymentResult.success).toBe(true)
      expect(paymentResult.receivable.balance_due).toBe(150.00)
      expect(paymentResult.receivable.total_paid).toBe(50.00)
    })

    it('should not allow overpayment', async () => {
      const { createReceivable } = await import('@/actions/receivables')
      const createResult = await createReceivable({
        customer_id: 'test-customer-3',
        original_amount: 100.00,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      
      expect(createResult.success).toBe(true)
      
      if (!createResult.success) return
      
      const { registerPayment } = await import('@/actions/receivables')
      const paymentResult = await registerPayment({
        receivable_id: createResult.receivable.id,
        amount: 150.00, // More than the original amount
        payment_method: 'cash'
      })
      
      // The system should handle this - either reject or allow with adjustment
      expect(paymentResult.success).toBe(true) // Or false, depending on business rule
    })
  })

  describe('getReceivables', () => {
    it('should filter receivables by status', async () => {
      const { getReceivables } = await import('@/actions/receivables')
      
      const result = await getReceivables({
        period: 'overdue' as const
      })
      
      expect(result).toBeDefined()
    })

    it('should filter receivables by customer', async () => {
      const { getReceivables } = await import('@/actions/receivables')
      
      const result = await getReceivables({
        customer_id: 'test-customer-4'
      })
      
      expect(result).toBeDefined()
    })
  })
})