import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test file upload behavior for first vs later messages
describe('File Upload Message Order Investigation', () => {
  let mockConsoleLog: any
  let mockFormData: any
  let mockFetch: any

  beforeEach(() => {
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    // Mock FormData to track what's being sent
    const originalFormData = global.FormData
    mockFormData = vi.fn().mockImplementation(() => {
      const instance = new originalFormData()
      const originalAppend = instance.append
      const appendCalls: Array<{name: string, value: any}> = []
      
      instance.append = function(name: string, value: any) {
        appendCalls.push({ name, value })
        return originalAppend.call(this, name, value)
      }
      
      // Add tracking method
      ;(instance as any).getAppendCalls = () => appendCalls
      
      return instance
    })
    global.FormData = mockFormData

    // Mock fetch to capture requests
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        updated_context: { device_constants: {}, information: '' },
        chat_message: 'Response',
        session_id: 'test-session',
        gathering_requirements_estimated_progress: 0.5,
        current_stage: 'gathering_requirements',
        is_mcq: false,
        is_multiselect: false,
        mcq_options: []
      })
    })
    global.fetch = mockFetch

    // Mock File constructor
    global.File = class MockFile {
      name: string
      type: string
      size: number
      
      constructor(chunks: any[], filename: string, options: any = {}) {
        this.name = filename
        this.type = options.type || 'text/plain'
        this.size = chunks.reduce((sum, chunk) => sum + (chunk.length || 0), 0)
      }
    } as any
  })

  describe('FormData structure comparison', () => {
    it('should analyze first message vs later message file uploads', async () => {
      const { apiClient } = await import('~/lib/api-client')
      
      const mockContext = {
        device_constants: {},
        information: ''
      }
      
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      
      // Simulate first message with file
      await apiClient.updateContext(
        mockContext,
        'gathering_requirements',
        'First message with file',
        undefined,
        [testFile],
        undefined, // no previous message for first
        'test-session-1'
      )
      
      // Get FormData from first call
      const firstCall = mockFetch.mock.calls[0]
      const firstFormData = firstCall[1]?.body as FormData
      const firstAppendCalls = (firstFormData as any).getAppendCalls?.() || []
      
      console.log('First message FormData structure:')
      firstAppendCalls.forEach((call: any, index: number) => {
        if (call.name === 'files') {
          console.log(`  ${index}: ${call.name} = File(${call.value.name})`)
        } else {
          console.log(`  ${index}: ${call.name} = ${typeof call.value === 'string' ? call.value.slice(0, 50) : call.value}`)
        }
      })
      
      // Reset for second call
      mockFetch.mockClear()
      
      // Simulate later message with file
      await apiClient.updateContext(
        mockContext,
        'gathering_requirements',
        'Later message with file',
        undefined,
        [testFile],
        'Previous assistant response', // with previous message
        'test-session-1'
      )
      
      // Get FormData from second call  
      const secondCall = mockFetch.mock.calls[0]
      const secondFormData = secondCall[1]?.body as FormData
      const secondAppendCalls = (secondFormData as any).getAppendCalls?.() || []
      
      console.log('\nLater message FormData structure:')
      secondAppendCalls.forEach((call: any, index: number) => {
        if (call.name === 'files') {
          console.log(`  ${index}: ${call.name} = File(${call.value.name})`)
        } else {
          console.log(`  ${index}: ${call.name} = ${typeof call.value === 'string' ? call.value.slice(0, 50) : call.value}`)
        }
      })
      
      // Compare the structures
      console.log('\nComparison:')
      console.log(`First message has ${firstAppendCalls.length} FormData entries`)
      console.log(`Later message has ${secondAppendCalls.length} FormData entries`)
      
      const firstFileCount = firstAppendCalls.filter((call: any) => call.name === 'files').length
      const laterFileCount = secondAppendCalls.filter((call: any) => call.name === 'files').length
      
      console.log(`First message files: ${firstFileCount}`)
      console.log(`Later message files: ${laterFileCount}`)
      
      // Check if previous_copilot_message is present in later call
      const hasFirstPrevious = firstAppendCalls.some((call: any) => call.name === 'previous_copilot_message')
      const hasLaterPrevious = secondAppendCalls.some((call: any) => call.name === 'previous_copilot_message')
      
      console.log(`First message has previous_copilot_message: ${hasFirstPrevious}`)
      console.log(`Later message has previous_copilot_message: ${hasLaterPrevious}`)
      
      // Both should have files
      expect(firstFileCount).toBe(1)
      expect(laterFileCount).toBe(1)
      
      // Later message should have previous_copilot_message
      expect(hasFirstPrevious).toBe(false)
      expect(hasLaterPrevious).toBe(true)
    })
    
    it('should check field order in FormData', async () => {
      const { apiClient } = await import('~/lib/api-client')
      
      const mockContext = {
        device_constants: { 'Device.Type': 'PLC' },
        information: 'Some project info'
      }
      
      const testFile = new File(['test content'], 'datasheet.pdf', { type: 'application/pdf' })
      
      // Test with file
      await apiClient.updateContext(
        mockContext,
        'gathering_requirements',
        'Upload this datasheet',
        undefined,
        [testFile],
        'Previous message for context',
        'test-session-2'
      )
      
      const call = mockFetch.mock.calls[0]
      const formData = call[1]?.body as FormData
      const appendCalls = (formData as any).getAppendCalls?.() || []
      
      console.log('\nFormData field order:')
      appendCalls.forEach((call: any, index: number) => {
        console.log(`  ${index}: ${call.name}`)
      })
      
      // Verify all expected fields are present
      const fieldNames = appendCalls.map((call: any) => call.name)
      expect(fieldNames).toContain('session_id')
      expect(fieldNames).toContain('current_context')
      expect(fieldNames).toContain('current_stage')
      expect(fieldNames).toContain('message')
      expect(fieldNames).toContain('previous_copilot_message')
      expect(fieldNames).toContain('files')
    })
  })
  
  describe('Frontend file handling differences', () => {
    it('should test file processing in initial vs later messages', () => {
      // Simulate the file upload handling logic from the frontend
      const uploadedFiles = [
        {
          id: '1',
          name: 'test.txt',
          size: 100,
          type: 'text/plain',
          content: 'test file content',
          isBase64: false
        }
      ]
      
      // Test file-to-File conversion (first message scenario)
      const firstMessageFiles = uploadedFiles.map(f => {
        if (!f.content) {
          console.warn('File content missing for:', f.name, '- file will be empty')
        }
        
        let blob: Blob
        if (f.isBase64 && f.content) {
          // Base64 decoding logic
          try {
            const binaryString = atob(f.content)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            blob = new Blob([bytes], { type: f.type })
          } catch (error) {
            console.error('Failed to decode base64 for file:', f.name, error)
            blob = new Blob([''], { type: f.type })
          }
        } else {
          // Text content or no content
          blob = new Blob([f.content || ''], { type: f.type })
        }
        
        const file = new File([blob], f.name, { type: f.type })
        console.log('Created File object:', f.name, 'size:', file.size, 'type:', file.type)
        return file
      }).filter(f => f.size > 0)
      
      // Test file-to-File conversion (later message scenario - same logic)  
      const laterMessageFiles = uploadedFiles.map(f => {
        if (!f.content) {
          console.warn('File content missing for:', f.name, '- file will be empty')
        }
        
        let blob: Blob
        if (f.isBase64 && f.content) {
          try {
            const binaryString = atob(f.content)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            blob = new Blob([bytes], { type: f.type })
          } catch (error) {
            console.error('Failed to decode base64 for file:', f.name, error)
            blob = new Blob([''], { type: f.type })
          }
        } else {
          blob = new Blob([f.content || ''], { type: f.type })
        }
        
        const file = new File([blob], f.name, { type: f.type })
        console.log('Created File object:', f.name, 'size:', file.size, 'type:', file.type)
        return file
      }).filter(f => f.size > 0)
      
      console.log('\nFile processing comparison:')
      console.log(`First message files: ${firstMessageFiles.length}`)
      console.log(`Later message files: ${laterMessageFiles.length}`)
      
      expect(firstMessageFiles.length).toBe(laterMessageFiles.length)
      expect(firstMessageFiles[0].name).toBe(laterMessageFiles[0].name)
      expect(firstMessageFiles[0].size).toBe(laterMessageFiles[0].size)
    })
  })
})