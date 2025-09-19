import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

// Mock FormData
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

describe('Session Management - Functional Tests', () => {
  const mockContext: ProjectContext = {
    device_constants: { Device: { Model: 'Test' } },
    information: 'Test project'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
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

  describe('Session ID Generation and Persistence', () => {
    it('should generate valid UUID session IDs', () => {
      const sessionId1 = apiClient.getSessionId()
      const sessionId2 = apiClient.generateNewSession()
      
      // Both should be valid UUIDs
      expect(sessionId1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      expect(sessionId2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      
      // Should be different from each other
      expect(sessionId1).not.toBe(sessionId2)
    })

    it('should provide session IDs consistently', () => {
      const sessionId1 = apiClient.getSessionId()
      const sessionId2 = apiClient.getSessionId()
      
      // Same session ID should be returned when called multiple times
      expect(sessionId1).toBe(sessionId2)
      expect(sessionId1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it('should generate new session IDs when requested', () => {
      const sessionId1 = apiClient.getSessionId()
      const sessionId2 = apiClient.generateNewSession()
      const sessionId3 = apiClient.getSessionId()
      
      // After generating new session, getSessionId should return the new one
      expect(sessionId2).toBe(sessionId3)
      expect(sessionId1).not.toBe(sessionId2)
    })
  })

  describe('Session ID in API Calls', () => {
    it('should include session ID in updateContext requests', async () => {
      await apiClient.updateContext(
        mockContext,
        'gathering_requirements',
        'test message'
      )

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = vi.mocked(global.fetch).mock.calls[0]
      
      expect(url).toContain('/api/v1/context/update')
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

    it('should handle cleanup for multiple sessions', async () => {
      // Mock cleanup response for each individual call
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          message: 'Session cleaned up',
          cleaned_sessions: ['session-1'],
          files_removed: 5
        })
      } as any)

      const sessionIds = ['session-1', 'session-2']
      await apiClient.cleanupSession(sessionIds)

      // Should make individual calls for each session
      expect(global.fetch).toHaveBeenCalledTimes(2)
      
      // Verify first call
      expect(global.fetch).toHaveBeenNthCalledWith(1,
        expect.stringContaining('/api/v1/context/cleanup'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )
      
      // Verify second call  
      expect(global.fetch).toHaveBeenNthCalledWith(2,
        expect.stringContaining('/api/v1/context/cleanup'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )
      
      // Verify FormData contains correct session IDs
      const call1 = vi.mocked(global.fetch).mock.calls[0]
      const call2 = vi.mocked(global.fetch).mock.calls[1]
      const formData1 = call1[1]?.body as FormData
      const formData2 = call2[1]?.body as FormData
      expect(formData1.get('session_id')).toBe('session-1')
      expect(formData2.get('session_id')).toBe('session-2')
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
})