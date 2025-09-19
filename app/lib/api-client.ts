// API client for PLC Copilot backend
// Supports both localhost (development) and production (render.com) endpoints

// Enable localhost probing only in development builds running on localhost.
// In production builds (import.meta.env && !import.meta.env.DEV) this will be false
// and the client will use the production backend directly.
const ENABLE_LOCALHOST_TESTING = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV === true;

interface ProjectContext {
  device_constants: Record<string, any>;
  information: string;
}

interface ContextResponse {
  updated_context: ProjectContext;
  chat_message: string;
  session_id: string;
  gathering_requirements_estimated_progress?: number;
  current_stage: 'gathering_requirements' | 'code_generation' | 'refinement_testing';
  is_mcq: boolean;
  is_multiselect: boolean;
  mcq_question?: string;
  mcq_options: string[];
  generated_code?: string;
}

interface CleanupResponse {
  message: string;
  cleaned_sessions: string[];
  files_removed: number;
}

interface ApiError {
  detail?: string;
  message?: string;
}

class PLCCopilotApiClient {
  private baseUrl: string;
  private developmentPorts = ['8000', '8001']; // Try these ports in order
  private lastWorkingPort: string | null = null;
  private sessionId: string | null = null;
  
  constructor() {
    // Set initial URL - will be refined by auto-detection only if testing mode is enabled
    if (ENABLE_LOCALHOST_TESTING && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      // Start with the last working port or first in list
      const preferredPort = this.lastWorkingPort || this.developmentPorts[0];
      this.baseUrl = `http://localhost:${preferredPort}`;
    } else {
      this.baseUrl = 'https://plc-copilot.onrender.com';
    }
    
    // Initialize session management
    this.initializeSession();
  }

  // Initialize session with persistence and cleanup handlers
  private initializeSession(): void {
    if (typeof window === 'undefined') return;
    
    // Try to restore session from sessionStorage first, then localStorage
    this.sessionId = sessionStorage.getItem('plc-session-id') || 
                    localStorage.getItem('plc-session-id') || 
                    crypto.randomUUID();
    
    // Store in both sessionStorage (preferred) and localStorage (backup)
    sessionStorage.setItem('plc-session-id', this.sessionId);
    localStorage.setItem('plc-session-id', this.sessionId);
    
    // Setup cleanup handlers
    this.setupCleanupHandlers();
  }

  // Get current session ID
  getSessionId(): string {
    if (!this.sessionId) {
      this.initializeSession();
    }
    return this.sessionId!;
  }

  // Generate new session (useful for starting fresh)
  generateNewSession(): string {
    if (typeof window === 'undefined') return this.sessionId || crypto.randomUUID();
    
    this.sessionId = crypto.randomUUID();
    sessionStorage.setItem('plc-session-id', this.sessionId);
    localStorage.setItem('plc-session-id', this.sessionId);
    return this.sessionId;
  }

  // Setup automatic cleanup handlers
  private setupCleanupHandlers(): void {
    if (typeof window === 'undefined') return;

    // Cleanup on page unload using sendBeacon for reliability
    const handleUnload = () => {
      if (this.sessionId) {
        // Backend expects FormData with session_id field
        const formData = new FormData();
        formData.append('session_id', this.sessionId);
        
        try {
          // Use sendBeacon for reliable cleanup during page unload
          navigator.sendBeacon(`${this.baseUrl}/api/v1/context/cleanup`, formData);
        } catch (error) {
          console.warn('Failed to send cleanup beacon:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
  }

  // Auto-detect working development port (only if testing mode enabled)
  private async findWorkingPort(): Promise<string> {
    if (!ENABLE_LOCALHOST_TESTING || typeof window === 'undefined' || window.location.hostname !== 'localhost') {
      return 'https://plc-copilot.onrender.com';
    }

    // If we have a cached working port, try it first
    if (this.lastWorkingPort) {
      const cachedUrl = `http://localhost:${this.lastWorkingPort}`;
      if (await this.testUrl(cachedUrl)) {
        return cachedUrl;
      }
    }

    // Try each development port
    for (const port of this.developmentPorts) {
      const testUrl = `http://localhost:${port}`;
      if (await this.testUrl(testUrl)) {
        this.lastWorkingPort = port;
        this.baseUrl = testUrl;
        return testUrl;
      }
    }

    // If no local port works, fall back to production
    return 'https://plc-copilot.onrender.com';
  }

  private async testUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async updateContext(
    context: ProjectContext,
    stage: string,
    message?: string,
    mcqResponses?: string[],
    files?: File[],
    previousCopilotMessage?: string,
    sessionId?: string // Allow override for specific sessions
  ): Promise<ContextResponse> {
    const workingUrl = await this.findWorkingPort();
    const currentSessionId = sessionId || this.getSessionId();
    
    try {
      const formData = new FormData();
      
      // Required parameters
      formData.append('session_id', currentSessionId);
      formData.append('current_context', JSON.stringify(context));
      formData.append('current_stage', stage);
      
      // Optional parameters
      if (message) formData.append('message', message);
      if (mcqResponses?.length) formData.append('mcq_responses', JSON.stringify(mcqResponses));
      if (previousCopilotMessage) formData.append('previous_copilot_message', previousCopilotMessage);
      
      if (files) {
        files.forEach(file => formData.append('files', file));
      }

      const response = await fetch(`${workingUrl}/api/v1/context/update`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = this.getErrorMessage(response.status);
        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use the default error message
        }
        throw new Error(errorMessage);
      }

      const data: ContextResponse = await response.json();
      
      // Verify session ID matches
      if (data.session_id !== currentSessionId) {
        console.warn('Session ID mismatch detected', {
          sent: currentSessionId,
          received: data.session_id
        });
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Provide user-friendly error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to PLC Copilot backend. Please check your connection.');
      }
      
      throw error;
    }
  }

  // Clean up session files
  async cleanupSession(sessionIds?: string[]): Promise<CleanupResponse> {
    const workingUrl = await this.findWorkingPort();
    const idsToClean = sessionIds || [this.getSessionId()];
    
    try {
      // Backend expects multipart/form-data with single session_id field
      // For multiple sessions, we need to call the endpoint multiple times
      const cleanupResults: CleanupResponse[] = [];
      
      for (const sessionId of idsToClean) {
        const formData = new FormData();
        formData.append('session_id', sessionId);
        
        const response = await fetch(`${workingUrl}/api/v1/context/cleanup`, {
          method: 'POST',
          body: formData, // No Content-Type header - let browser set multipart/form-data
        });

        if (!response.ok) {
          let errorMessage = `Cleanup failed: ${response.status}`;
          try {
            const errorData: ApiError = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use the default error message
          }
          throw new Error(errorMessage);
        }

        const data: CleanupResponse = await response.json();
        cleanupResults.push(data);
      }
      
      // Merge cleanup results
      const combinedResult: CleanupResponse = {
        message: `Cleaned up ${idsToClean.length} session(s)`,
        cleaned_sessions: cleanupResults.flatMap(r => r.cleaned_sessions),
        files_removed: cleanupResults.reduce((sum, r) => sum + r.files_removed, 0)
      };
      
      // Clear session storage if we cleaned up the current session
      if (typeof window !== 'undefined' && idsToClean.includes(this.sessionId!)) {
        sessionStorage.removeItem('plc-session-id');
        localStorage.removeItem('plc-session-id');
        this.sessionId = null;
      }
      
      return combinedResult;
    } catch (error) {
      console.error('Session cleanup failed:', error);
      // Non-critical - sessions auto-expire after 30 minutes
      throw error;
    }
  }

  // Helper method to get user-friendly error messages
  private getErrorMessage(status: number): string {
    switch (status) {
      case 413:
        return 'File too large. Maximum size is 50MB.';
      case 415:
        return 'Unsupported file type. Use PDF, TXT, or DOC files.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return `HTTP error! status: ${status}`;
    }
  }

  // Health check method to test connectivity
  async healthCheck(): Promise<boolean> {
    try {
      const workingUrl = await this.findWorkingPort();
      const response = await fetch(`${workingUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get current base URL for debugging
  async getBaseUrl(): Promise<string> {
    return await this.findWorkingPort();
  }
}

// Export singleton instance
export const apiClient = new PLCCopilotApiClient();

// Export types for use in components
export type { ProjectContext, ContextResponse, ApiError, CleanupResponse };