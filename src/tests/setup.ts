// Test setup file
// This file runs before each test suite

import '@testing-library/jest-dom'

// Mock ResizeObserver for jsdom
global.ResizeObserver = global.ResizeObserver || function () {
  const callbacks = new Set()
  return {
    observe: (target: Element, callback: () => void) => {
      callbacks.add(callback)
      return {
        unobserve: () => {},
      }
    },
    unobserve: () => {},
    disconnect: () => {},
  }
}

// Mock matchMedia
global.matchMedia = global.matchMedia || function (params: string) {
  return {
    matches: false,
    media: params,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }
}

// Supabase mock for tests (if needed)
vi.mock('@/lib/supabase/client', () => {
  return {
    createBrowserClient: () => ({
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
        insert: () => Promise.resolve({ error: null, data: null }),
        update: () => Promise.resolve({ error: null, data: null }),
        delete: () => Promise.resolve({ error: null }),
        order: () => ({ }),
        gte: () => ({ }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { off: () => {} } }),
        signIn: () => Promise.resolve({ error: null }),
        signUp: () => Promise.resolve({ error: null, data: null }),
        offAuthStateChange: () => {},
      },
      rpc: () => Promise.resolve({ data: null, error: null }),
    }),
    createServerClient: () => ({
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }),
        insert: () => Promise.resolve({ error: null, data: null }),
        update: () => Promise.resolve({ error: null, data: null }),
        delete: () => Promise.resolve({ error: null }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { off: () => {} } }),
        signIn: () => Promise.resolve({ error: null }),
      },
    }),
  }
})