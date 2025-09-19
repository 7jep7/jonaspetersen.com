import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '~/lib/api-client'
import type { ProjectContext, ContextResponse } from '~/lib/api-client'

describe('PLCCopilotApiClient - Essential Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Core Functionality', () => {
    const mockContext: ProjectContext = {
      device_constants: { Device: { Model: 'VS-C1500CX' } },
      information: 'Test project'
    }

    const mockResponse: ContextResponse = {
      updated_context: mockContext,
      chat_message: 'Test response',
      session_id: 'test-session-id',
      current_stage: 'gathering_requirements',
      is_mcq: false,
      is_multiselect: false,
      mcq_options: []
    }

    it('should generate session IDs', () => {
      const sessionId1 = apiClient.getSessionId()
      const sessionId2 = apiClient.generateNewSession()
      
      // Both should be valid UUIDs
      expect(sessionId1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      expect(sessionId2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      
      // Should be different
      expect(sessionId1).not.toBe(sessionId2)
    })

    it('should send updateContext requests with proper FormData', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
      global.fetch = mockFetch

      await apiClient.updateContext(mockContext, 'gathering_requirements', 'Test message')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/context/update'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )

      // Verify FormData contains required fields
      const call = mockFetch.mock.calls[0]
      const formData = call[1]?.body as FormData
      expect(formData.get('session_id')).toBeTruthy()
      expect(formData.get('current_context')).toBeTruthy()
      expect(formData.get('current_stage')).toBe('gathering_requirements')
      expect(formData.get('message')).toBe('Test message')
    })

    it('should handle file uploads with session context', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
      global.fetch = mockFetch

      // Mock File constructor
      global.File = class MockFile {
        name: string
        constructor(chunks: any[], filename: string) {
          this.name = filename
        }
      } as any

      const testFile = new File(['content'], 'test.pdf')
      await apiClient.updateContext(mockContext, 'gathering_requirements', 'Upload file', undefined, [testFile])

      const call = mockFetch.mock.calls[0]
      const formData = call[1]?.body as FormData
      expect(formData.get('session_id')).toBeTruthy()
      expect(formData.getAll('files')).toHaveLength(1)
    })

    it('should handle API errors gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 413,
        json: () => Promise.resolve({ detail: 'File too large' })
      })
      global.fetch = mockFetch

      await expect(
        apiClient.updateContext(mockContext, 'gathering_requirements', 'Test')
      ).rejects.toThrow('File too large')
    })

    it('should perform health checks', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true })
      global.fetch = mockFetch

      const isHealthy = await apiClient.healthCheck()
      expect(isHealthy).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
      )
    })
  })
})