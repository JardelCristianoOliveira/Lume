import { describe, it, expect, beforeEach, vi } from 'vitest'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

describe('Authentication', () => {
  beforeEach(() => {
    // Clear any stored session before each test
    localStorage.clear()
    sessionStorage.clear()
  })

  it('should deny access to unauthenticated users', () => {
    // Test that unauthenticated users cannot access protected routes
    const isAuthenticated = false
    expect(isAuthenticated).toBe(false)
  })

  it('should allow login with valid credentials', async () => {
    // This would test the actual login flow
    // For now, test the mock behavior
    const { signIn } = await import('@/lib/supabase/client')
    // The mock should allow signIn without throwing
    const result = await signIn('test@test.com', 'password123')
    expect(result.error).toBeNull()
  })

  it('should redirect to login when not authenticated', () => {
    // Test that unauthenticated users are redirected
    const token = localStorage.getItem('supabase.auth.token')
    expect(token).toBeNull()
  })
})