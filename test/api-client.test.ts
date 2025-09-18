import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient } from '~/lib/api-client'
import type { ProjectContext, ContextResponse } from '~/lib/api-client'

describe('PLCCopilotApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('updateContext', () => {
    const mockContext: ProjectContext = {
      device_constants: {
        Device: {
          Model: 'VS-C1500CX',
          Vendor: 'KEYENCE'
        }
      },
      information: 'Test project information'
    }

    const mockResponse: ContextResponse = {
      updated_context: {
        device_constants: {
          Device: {
            Model: 'VS-C1500CX',
            Vendor: 'KEYENCE',
            Class: 'Camera'
          }
        },
        information: 'Updated project information'
      },
      chat_message: 'Test response message',
      current_stage: 'gathering_requirements',
      is_mcq: false,
      is_multiselect: false,
      mcq_options: []
    }

    it('should send a basic message request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
      global.fetch = mockFetch

      const result = await apiClient.updateContext(
        mockContext,
        'gathering_requirements',
        'Test message'
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'https://plc-copilot.onrender.com/api/v1/context/update',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )

      // Verify FormData contents
      const formData = mockFetch.mock.calls[0][1].body as FormData
      expect(formData.get('message')).toBe('Test message')
      expect(formData.get('current_context')).toBe(JSON.stringify(mockContext))
      expect(formData.get('current_stage')).toBe('gathering_requirements')

      expect(result).toEqual(mockResponse)
    })

    it('should send MCQ responses', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
      global.fetch = mockFetch

      const mcqResponses = ['Option A', 'Option B']
      
      await apiClient.updateContext(
        mockContext,
        'gathering_requirements',
        undefined,
        mcqResponses
      )

      const formData = mockFetch.mock.calls[0][1].body as FormData
      expect(formData.get('mcq_responses')).toBe(JSON.stringify(mcqResponses))
      expect(formData.get('message')).toBeNull()
    })

    it('should send files', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
      global.fetch = mockFetch

      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      
      await apiClient.updateContext(
        mockContext,
        'gathering_requirements',
        'Process this file',
        undefined,
        [testFile]
      )

      const formData = mockFetch.mock.calls[0][1].body as FormData
      expect(formData.getAll('files')).toHaveLength(1)
      expect(formData.get('files')).toBeInstanceOf(File)
    })

    it('should handle combined message, MCQ, and files', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
      global.fetch = mockFetch

      const mcqResponses = ['Selected option']
      const testFile = new File(['datasheet content'], 'datasheet.pdf', { type: 'application/pdf' })
      
      await apiClient.updateContext(
        mockContext,
        'code_generation',
        'Generate code with these specifications',
        mcqResponses,
        [testFile]
      )

      const formData = mockFetch.mock.calls[0][1].body as FormData
      expect(formData.get('message')).toBe('Generate code with these specifications')
      expect(formData.get('mcq_responses')).toBe(JSON.stringify(mcqResponses))
      expect(formData.get('current_stage')).toBe('code_generation')
      expect(formData.getAll('files')).toHaveLength(1)
    })

    it('should send previous copilot message', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
      global.fetch = mockFetch

      const previousMessage = 'What type of sensor are you using?'
      
      await apiClient.updateContext(
        mockContext,
        'gathering_requirements',
        'A pressure sensor',
        undefined,
        undefined,
        previousMessage
      )

      const formData = mockFetch.mock.calls[0][1].body as FormData
      expect(formData.get('previous_copilot_message')).toBe(previousMessage)
      expect(formData.get('message')).toBe('A pressure sensor')
    })

    it('should handle API errors with detailed messages', async () => {
      const errorResponse = {
        detail: 'Invalid stage parameter'
      }

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse)
      })
      global.fetch = mockFetch

      await expect(
        apiClient.updateContext(mockContext, 'invalid_stage', 'Test message')
      ).rejects.toThrow('Invalid stage parameter')
    })

    it('should handle network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'))
      global.fetch = mockFetch

      await expect(
        apiClient.updateContext(mockContext, 'gathering_requirements', 'Test message')
      ).rejects.toThrow('Unable to connect to PLC Copilot backend. Please check your connection.')
    })

    it('should handle malformed JSON error responses', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })
      global.fetch = mockFetch

      await expect(
        apiClient.updateContext(mockContext, 'gathering_requirements', 'Test message')
      ).rejects.toThrow('HTTP error! status: 500')
    })
  })

  describe('healthCheck', () => {
    it('should return true for healthy backend', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true
      })
      global.fetch = mockFetch

      const result = await apiClient.healthCheck()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://plc-copilot.onrender.com/health',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        })
      )
      expect(result).toBe(true)
    })

    it('should return false for unhealthy backend', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false
      })
      global.fetch = mockFetch

      const result = await apiClient.healthCheck()
      expect(result).toBe(false)
    })

    it('should return false for network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
      global.fetch = mockFetch

      const result = await apiClient.healthCheck()
      expect(result).toBe(false)
    })
  })

  describe('getBaseUrl', () => {
    it('should return production URL by default', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true
      })
      global.fetch = mockFetch

      const url = await apiClient.getBaseUrl()
      expect(url).toBe('https://plc-copilot.onrender.com')
    })
  })
})