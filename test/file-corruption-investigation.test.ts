import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test to investigate if files are being corrupted during upload
describe('File Corruption Investigation', () => {
  let mockConsoleLog: any

  beforeEach(() => {
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('File content integrity during upload process', () => {
    it('should verify binary file handling in upload process', async () => {

      // Create a mock PDF file with binary content (PDF header)
      const pdfHeader = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
        0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A        // PDF magic bytes
      ])
      
      // Mock file reading process from session screen upload
      const simulateFileUpload = async (fileContent: Uint8Array, filename: string) => {
        console.log(`\nSimulating upload of ${filename}`)
        console.log(`Original size: ${fileContent.length} bytes`)
        console.log(`Original header: ${Array.from(fileContent.slice(0, 8)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ')}`)
        
        // Simulate the file upload handling from the session screen
        const file = new File([new Uint8Array(fileContent)], filename, { type: 'application/pdf' })
        
        let content: string | null = null
        let isBase64 = false
        
        try {
          // This is the problematic part - session screen tries to read as text first
          content = await file.text()
            // Silent: record content for detection only
          
          // Check if content looks like binary (has null bytes, replacement chars, or round-trip length mismatch)
          const hasNullBytes = content.includes('\0')
          const hasReplacementChar = content.includes('\uFFFD')
          // Compare byte lengths after round-trip through TextEncoder to detect decoding changes
          let roundTripMismatch = false
          try {
            const encoded = new TextEncoder().encode(content)
            roundTripMismatch = encoded.length !== fileContent.length
          } catch (e) {
            // If TextEncoder isn't available or fails, skip this check
            roundTripMismatch = false
          }

          // Silent: detection variables set

          // If the text read contains binary indicators, fall back to base64 encoding
          if (hasNullBytes || hasReplacementChar || roundTripMismatch) {
            // Detected binary data in text read - falling back to base64 encoding
            try {
              const arrayBuffer = await file.arrayBuffer()
              const uint8Array = new Uint8Array(arrayBuffer)
              if (typeof Buffer !== 'undefined') {
                content = Buffer.from(uint8Array).toString('base64')
              } else {
                // Build binary string safely without spreading large arrays
                let binary = ''
                for (let i = 0; i < uint8Array.length; i++) {
                  binary += String.fromCharCode(uint8Array[i])
                }
                content = btoa(binary)
              }
              isBase64 = true
            } catch (base64Error) {
              console.log('Base64 encoding failed (fallback):', base64Error)
              content = null
            }
          }
        } catch (err) {
          // Text reading failed, try base64
          
          // Fallback to base64 for binary files
          try {
            const arrayBuffer = await file.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)
            // Build binary string safely
            let binary = ''
            for (let i = 0; i < uint8Array.length; i++) {
              binary += String.fromCharCode(uint8Array[i])
            }
            content = btoa(binary)
            isBase64 = true
          } catch (base64Error) {
            console.log('Base64 encoding failed:', base64Error)
            content = null
          }
        }
        
        return { content, isBase64, originalSize: fileContent.length }
      }
      
      const result = await simulateFileUpload(pdfHeader, 'test.pdf')
      
      // Now simulate the API conversion process (File object creation)
  // Simulating API File object creation
      
      let blob: Blob
      if (result.isBase64 && result.content) {
  // Processing as base64 content
        try {
          const binaryString = atob(result.content)
          // decoded binaryString
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          blob = new Blob([bytes], { type: 'application/pdf' })
        } catch (error) {
          console.error('Failed to decode base64:', error)
          blob = new Blob([''], { type: 'application/pdf' })
        }
      } else {
  // Processing as text content
        blob = new Blob([result.content || ''], { type: 'application/pdf' })
        
      }
      
      const finalFile = new File([blob], 'test.pdf', { type: 'application/pdf' })
  // Final File object size available
      
      // Verify integrity
      const finalBuffer = await finalFile.arrayBuffer()
      const finalBytes = new Uint8Array(finalBuffer)
  // Final header available
      
      // Check if the file was corrupted
      const originalHeader = Array.from(pdfHeader.slice(0, 8))
      const finalHeader = Array.from(finalBytes.slice(0, 8))
      
  // Integrity check: original and final headers available for assertion
      
      // Expect no corruption
      expect(finalBytes.length).toBe(pdfHeader.length)
      expect(finalHeader).toEqual(originalHeader)
    })
    
    it('should compare index page vs session page file handling', async () => {
      const testContent = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D]) // %PDF-
      
      // Simulate index page file handling (more sophisticated)
      console.log('\nIndex page file handling simulation:')
      const indexFile = new File([new Uint8Array(testContent)], 'test.pdf', { type: 'application/pdf' })
      
      let indexContent: string | null = null
      let indexIsBase64 = false
      
      // Index page logic (from app/routes/projects.plc-copilot._index.tsx)
      const isTextFile = indexFile.type.startsWith('text/') || 
                        indexFile.type === 'application/json' ||
                        indexFile.type === 'application/xml' ||
                        indexFile.name.endsWith('.txt')
      
      console.log(`Detected as text file: ${isTextFile}`)
      
      if (isTextFile) {
        try {
          indexContent = await indexFile.text()
        } catch (err) {
          console.log('Index page text reading failed:', err)
          indexContent = null
        }
      } else {
        // Binary file - use base64
        try {
          const arrayBuffer = await indexFile.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          if (typeof Buffer !== 'undefined') {
            indexContent = Buffer.from(uint8Array).toString('base64')
          } else {
            let binary = ''
            for (let i = 0; i < uint8Array.length; i++) {
              binary += String.fromCharCode(uint8Array[i])
            }
            indexContent = btoa(binary)
          }
          indexIsBase64 = true
          console.log(`Index page base64 length: ${indexContent.length}`)
        } catch (error) {
          console.log('Index page base64 failed:', error)
          indexContent = null
        }
      }
      
      // Simulate session page file handling (simpler, potentially problematic)
      console.log('\nSession page file handling simulation:')
      const sessionFile = new File([new Uint8Array(testContent)], 'test.pdf', { type: 'application/pdf' })
      
      let sessionContent: string | null = null
      try {
        // Session page always tries text first
        sessionContent = await sessionFile.text()
        console.log(`Session page text content: "${sessionContent}"`)
        console.log(`Session page content length: ${sessionContent.length}`)
      } catch (err) {
        console.log('Session page text reading failed:', err)
        sessionContent = null
      }
      
      // Compare results
      console.log('\nComparison:')
      console.log(`Index isBase64: ${indexIsBase64}`)
      console.log(`Session isBase64: false (always text)`)
      console.log(`Index content length: ${indexContent?.length || 0}`)
      console.log(`Session content length: ${sessionContent?.length || 0}`)
      
      // The issue: session page doesn't properly handle binary files
      if (!isTextFile && sessionContent) {
        console.log('⚠️  Session page read binary file as text - potential corruption!')
        
        // Check for corruption indicators
        const hasNullBytes = sessionContent.includes('\0')
        const hasReplacementChars = sessionContent.includes('\uFFFD')
        console.log(`Has null bytes: ${hasNullBytes}`)
        console.log(`Has replacement chars: ${hasReplacementChars}`)
      }
      
      expect(indexIsBase64).toBe(true) // Index page should use base64 for PDF
      expect(sessionContent).not.toBeNull() // Session page reads as text (problematic)
    })
    
    it('should test specific binary sequences that cause text corruption', async () => {
      // Test sequences that are known to cause issues when read as text
      const problematicSequences = [
        { name: 'PDF with null bytes', bytes: [0x25, 0x50, 0x44, 0x46, 0x00, 0x01, 0x02] },
        { name: 'High byte sequence', bytes: [0xFF, 0xFE, 0xFD, 0xFC] },
        { name: 'Mixed sequence', bytes: [0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x00, 0xFF, 0x20] } // "Hello" + null + high + space
      ]
      
      for (const seq of problematicSequences) {
        console.log(`\nTesting: ${seq.name}`)
        const bytes = new Uint8Array(seq.bytes)
        const file = new File([new Uint8Array(bytes)], 'test.bin', { type: 'application/octet-stream' })
        
        try {
          const textContent = await file.text()
          console.log(`Text length: ${textContent.length}`)
          console.log(`Original bytes: [${seq.bytes.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', ')}]`)
          console.log(`Text chars: [${Array.from(textContent).map(c => `0x${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(', ')}]`)
          
          // Check if round-trip is possible
          const reconstructed = new TextEncoder().encode(textContent)
          const matches = reconstructed.length === bytes.length && 
                         reconstructed.every((byte, i) => byte === bytes[i])
          
          console.log(`Round-trip successful: ${matches}`)
          
          if (!matches) {
            console.log('⚠️  Data corruption detected in text conversion!')
          }
          
        } catch (error) {
          console.log(`Text reading failed: ${error}`)
        }
      }
    })
  })
})