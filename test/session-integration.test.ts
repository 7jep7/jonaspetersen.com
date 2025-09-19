import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch at module level
global.fetch = vi.fn()

// Mock storage with a simple implementation
const mockStorage = new Map<string, string>()

global.sessionStorage = {
  getItem: vi.fn((key: string) => mockStorage.get(`session_${key}`) || null),
  setItem: vi.fn((key: string, value: string) => mockStorage.set(`session_${key}`, value)),
  removeItem: vi.fn((key: string) => mockStorage.delete(`session_${key}`)),
  clear: vi.fn(() => mockStorage.clear())
} as any

global.localStorage = {
  getItem: vi.fn((key: string) => mockStorage.get(`local_${key}`) || null),
  setItem: vi.fn((key: string, value: string) => mockStorage.set(`local_${key}`, value)),
  removeItem: vi.fn((key: string) => mockStorage.delete(`local_${key}`)),
  clear: vi.fn(() => mockStorage.clear())
} as any

global.navigator = {
  sendBeacon: vi.fn(() => true)
} as any

// Enhanced FormData mock
global.FormData = class MockFormData {
  private data: Map<string, any> = new Map()
  
  append(name: string, value: any) {
    if (this.data.has(name)) {
      const existing = this.data.get(name)
      if (Array.isArray(existing)) {
        existing.push(value)
      } else {
        this.data.set(name, [existing, value])
      }
    } else {
      this.data.set(name, value)
    }
  }
  
  get(name: string) {
    const value = this.data.get(name)
    return Array.isArray(value) ? value[0] : value
  }
  
  getAll(name: string) {
    const value = this.data.get(name)
    return Array.isArray(value) ? value : value ? [value] : []
  }
  
  has(name: string) {
    return this.data.has(name)
  }
  
  set(name: string, value: any) {
    this.data.set(name, value)
  }
} as any

// Import after setting up mocks
import { apiClient } from '~/lib/api-client'
import type { ProjectContext } from '~/lib/api-client'

describe('Session Integration Tests', () => {
  const mockContext: ProjectContext = {
    device_constants: { Device: { Model: 'Test' } },
    information: 'Test project'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage.clear()
    
    // Mock successful response
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        updated_context: mockContext,
        chat_message: 'Success',
        session_id: 'server-session-123',
        current_stage: 'gathering_requirements',
        is_mcq: false,
        is_multiselect: false,
        mcq_options: []
      })
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Session ID Lifecycle', () => {
    it('should generate valid UUID session IDs', () => {
      const sessionId1 = apiClient.getSessionId()
      const sessionId2 = apiClient.generateNewSession()
      
      // Both should be valid UUIDs
      expect(sessionId1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      expect(sessionId2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      
      // Should be different
      expect(sessionId1).not.toBe(sessionId2)
    })

    it('should persist session ID in storage', () => {
      // Clear any previous calls to the mocks
      vi.clearAllMocks()
      
      // Force a new session to trigger storage calls
      const sessionId = apiClient.generateNewSession()
      
      // Should be stored in sessionStorage
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith('plc-session-id', sessionId)
      expect(global.localStorage.setItem).toHaveBeenCalledWith('plc-session-id', sessionId)
    })

    it('should restore session ID from storage', async () => {
      // Set up existing session in storage  
      const existingSessionId = 'existing-session-123'
      
      // Mock storage to return the existing session
      vi.mocked(global.sessionStorage.getItem).mockImplementation((key) => {
        if (key === 'plc-session-id') return existingSessionId
        return mockStorage.get(`session_${key}`) || null
      })
      vi.mocked(global.localStorage.getItem).mockImplementation((key) => {
        if (key === 'plc-session-id') return existingSessionId  
        return mockStorage.get(`local_${key}`) || null
      })
      
      // Import a fresh instance of the API client to trigger session restoration
      vi.resetModules()
      const { apiClient: newApiClient } = await import('~/lib/api-client')
      const sessionId = newApiClient.getSessionId()
      
      expect(sessionId).toBe(existingSessionId)
    })
  })

  describe('API Integration with Session ID', () => {
    it('should include session ID in updateContext requests', async () => {
      await apiClient.updateContext(
        mockContext,
        'gathering_requirements',
        'test message'
      )

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = vi.mocked(global.fetch).mock.calls[0]
      
      expect(url).toContain('/api/v1/context/update')
      expect(options).toBeDefined()
      expect(options!.method).toBe('POST')
      expect(options!.body).toBeInstanceOf(FormData)

      const formData = options!.body as FormData
      const sessionId = formData.get('session_id')
      expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it('should handle session ID mismatch in responses', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Mock response with different session ID
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          updated_context: mockContext,
          chat_message: 'Success',
          session_id: 'different-session-id',
          current_stage: 'gathering_requirements',
          is_mcq: false,
          is_multiselect: false,
          mcq_options: []
        })
      } as any)

      await apiClient.updateContext(mockContext, 'gathering_requirements', 'test message')

      expect(consoleSpy).toHaveBeenCalledWith(
        'Session ID mismatch detected',
        expect.objectContaining({
          sent: expect.any(String),
          received: 'different-session-id'
        })
      )
    })
  })

  describe('Session Cleanup', () => {
    it('should send cleanup request with session ID', async () => {
      // Mock cleanup response
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          message: 'Sessions cleaned up',
          cleaned_sessions: ['session-123'],
          files_removed: 5
        })
      } as any)

      await apiClient.cleanupSession()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/context/cleanup'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )
      
      // Verify FormData contains session_id
      const call = vi.mocked(global.fetch).mock.calls[0]
      const formData = call[1]?.body as FormData
      expect(formData.get('session_id')).toBeTruthy()
    })

    it('should clear storage when cleaning current session', async () => {
      const currentSessionId = apiClient.getSessionId()
      
      // Mock cleanup response
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          message: 'Sessions cleaned up',
          cleaned_sessions: [currentSessionId],
          files_removed: 1
        })
      } as any)

      await apiClient.cleanupSession([currentSessionId])

      expect(global.sessionStorage.removeItem).toHaveBeenCalledWith('plc-session-id')
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('plc-session-id')
    })
  })

  describe('File Upload Integration', () => {
    it('should attach files with session ID in FormData', async () => {
      global.File = class MockFile {
        name: string
        type: string
        size: number
        
        constructor(chunks: any[], filename: string, options: any = {}) {
          this.name = filename
          this.type = options.type || 'text/plain'
          this.size = chunks.reduce((size, chunk) => size + chunk.length, 0)
        }
      } as any

      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

      await apiClient.updateContext(
        mockContext,
        'gathering_requirements',
        'Upload this file',
        undefined,
        [testFile]
      )

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = vi.mocked(global.fetch).mock.calls[0]
      
      const formData = options!.body as FormData
      expect(formData.get('session_id')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      
      const uploadedFiles = formData.getAll('files')
      expect(uploadedFiles).toHaveLength(1)
      expect(uploadedFiles[0]).toBeInstanceOf(File)
    })
  })

  describe('Automatic Cleanup', () => {
    it('should use sendBeacon for cleanup on page unload', () => {
      const currentSessionId = apiClient.getSessionId()
      
      // Simulate page unload event
      const unloadEvent = new Event('beforeunload')
      window.dispatchEvent(unloadEvent)

      expect(global.navigator.sendBeacon).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/context/cleanup'),
        expect.any(FormData)
      )
      
      // Verify FormData contains correct session_id
      const call = vi.mocked(global.navigator.sendBeacon).mock.calls[0]
      const formData = call[1] as FormData
      expect(formData.get('session_id')).toBe(currentSessionId)
    })
  })
})