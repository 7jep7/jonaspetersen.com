import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock fetch for testing
global.fetch = vi.fn()

// Mock window.location for localhost testing
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    href: 'http://localhost:3000'
  },
  writable: true
})

// Mock AbortSignal.timeout for older environments
if (!AbortSignal.timeout) {
  AbortSignal.timeout = (ms: number) => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), ms)
    return controller.signal
  }
}

// Mock File API methods for jsdom environment
if (typeof File !== 'undefined') {
  File.prototype.text = vi.fn().mockImplementation(function(this: File) {
    return Promise.resolve('mocked file content')
  })
  
  File.prototype.arrayBuffer = vi.fn().mockImplementation(function(this: File) {
    const buffer = new ArrayBuffer(this.size)
    return Promise.resolve(buffer)
  })
}