// API client for PLC Copilot backend
// Supports both localhost (development) and production (render.com) endpoints

// Testing mode - set to true to enable localhost health checks in development
const ENABLE_LOCALHOST_TESTING = false;

interface ProjectContext {
  device_constants: Record<string, any>;
  information: string;
}

interface ContextResponse {
  updated_context: ProjectContext;
  chat_message: string;
  gathering_requirements_estimated_progress?: number;
  current_stage: 'gathering_requirements' | 'code_generation' | 'refinement_testing';
  is_mcq: boolean;
  is_multiselect: boolean;
  mcq_question?: string;
  mcq_options: string[];
  generated_code?: string;
}

interface ApiError {
  detail?: string;
  message?: string;
}

class PLCCopilotApiClient {
  private baseUrl: string;
  private developmentPorts = ['8000', '8001']; // Try these ports in order
  private lastWorkingPort: string | null = null;
  
  constructor() {
    // Set initial URL - will be refined by auto-detection only if testing mode is enabled
    if (ENABLE_LOCALHOST_TESTING && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      // Start with the last working port or first in list
      const preferredPort = this.lastWorkingPort || this.developmentPorts[0];
      this.baseUrl = `http://localhost:${preferredPort}`;
    } else {
      this.baseUrl = 'https://plc-copilot.onrender.com';
    }
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
    previousCopilotMessage?: string
  ): Promise<ContextResponse> {
    const workingUrl = await this.findWorkingPort();
    
    try {
      const formData = new FormData();
      
      if (message) formData.append('message', message);
      if (mcqResponses?.length) formData.append('mcq_responses', JSON.stringify(mcqResponses));
      if (previousCopilotMessage) formData.append('previous_copilot_message', previousCopilotMessage);
      formData.append('current_context', JSON.stringify(context));
      formData.append('current_stage', stage);
      
      if (files) {
        files.forEach(file => formData.append('files', file));
      }

      const response = await fetch(`${workingUrl}/api/v1/context/update`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use the default error message
        }
        throw new Error(errorMessage);
      }

      const data: ContextResponse = await response.json();
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
export type { ProjectContext, ContextResponse, ApiError };