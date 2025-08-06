// ABOUTME: Test setup file for Vitest configuration  
// ABOUTME: Configures global test utilities and DOM environment

import { beforeEach, vi } from 'vitest'

// Mock CSS modules
vi.mock('*.css', () => ({}))

// Mock media queries for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock navigator.clipboard for copy functionality tests
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve())
  }
})

// Clean up before each test
beforeEach(() => {
  document.body.innerHTML = ''
})