import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test generated code handling with stage-based assertions
describe('Generated Code Management', () => {
  // Mock console.error to capture assertion failures
  let consoleErrorSpy: any;
  let logMessages: string[] = [];

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logMessages = [];
  });

  const mockLogTerminal = (message: string) => {
    logMessages.push(message);
  };

  // Simulate the updateContextFromResponse function logic
  const simulateGeneratedCodeHandling = (
    response: any, 
    currentStage: string,
    setGeneratedCode: (code: string) => void,
    logTerminal: (message: string) => void
  ) => {
    // Handle generated code with stage-based assertions
    if (response.generated_code !== undefined) {
      const currentStageForGeneration = response.current_stage || currentStage;
      
      // Assert that generated_code is not empty when in code generation or refinement stages
      if ((currentStageForGeneration === 'code_generation' || currentStageForGeneration === 'refinement_testing')) {
        if (!response.generated_code || response.generated_code.trim() === '') {
          logTerminal(`ERROR: Empty generated_code received in ${currentStageForGeneration} stage`);
          console.error(`Generated code assertion failed: Expected non-empty code in stage ${currentStageForGeneration}, but received: "${response.generated_code}"`);
        } else {
          // Update the Structured Text code with generated code from backend
          setGeneratedCode(response.generated_code);
          logTerminal(`Generated code updated (${response.generated_code.length} chars) for stage: ${currentStageForGeneration}`);
        }
      } else {
        // In other stages, still update if code is provided
        if (response.generated_code) {
          setGeneratedCode(response.generated_code);
          logTerminal(`Generated code updated: ${response.generated_code.length} characters`);
        }
      }
    }
  };

  describe('Stage-based assertions', () => {
    it('should assert when generated_code is empty in code_generation stage', () => {
      let generatedCode = '';
      const mockSetGeneratedCode = vi.fn((code: string) => { generatedCode = code; });

      const response = {
        generated_code: '',
        current_stage: 'code_generation'
      };

      simulateGeneratedCodeHandling(response, 'gather_requirements', mockSetGeneratedCode, mockLogTerminal);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generated code assertion failed: Expected non-empty code in stage code_generation')
      );
      expect(logMessages).toContain('ERROR: Empty generated_code received in code_generation stage');
      expect(mockSetGeneratedCode).not.toHaveBeenCalled();
    });

    it('should assert when generated_code is whitespace-only in refinement_testing stage', () => {
      let generatedCode = '';
      const mockSetGeneratedCode = vi.fn((code: string) => { generatedCode = code; });

      const response = {
        generated_code: '   \n\t  ',
        current_stage: 'refinement_testing'
      };

      simulateGeneratedCodeHandling(response, 'code_generation', mockSetGeneratedCode, mockLogTerminal);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generated code assertion failed: Expected non-empty code in stage refinement_testing')
      );
      expect(logMessages).toContain('ERROR: Empty generated_code received in refinement_testing stage');
      expect(mockSetGeneratedCode).not.toHaveBeenCalled();
    });

    it('should assert when generated_code is null in code_generation stage', () => {
      let generatedCode = '';
      const mockSetGeneratedCode = vi.fn((code: string) => { generatedCode = code; });

      const response = {
        generated_code: null,
        current_stage: 'code_generation'
      };

      simulateGeneratedCodeHandling(response, 'gather_requirements', mockSetGeneratedCode, mockLogTerminal);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generated code assertion failed: Expected non-empty code in stage code_generation')
      );
      expect(logMessages).toContain('ERROR: Empty generated_code received in code_generation stage');
      expect(mockSetGeneratedCode).not.toHaveBeenCalled();
    });
  });

  describe('Valid generated code handling', () => {
    it('should update generated code when valid code is provided in code_generation stage', () => {
      let generatedCode = '';
      const mockSetGeneratedCode = vi.fn((code: string) => { generatedCode = code; });

      const validCode = `PROGRAM Main
VAR
  Counter : INT := 0;
END_VAR

Counter := Counter + 1;

END_PROGRAM`;

      const response = {
        generated_code: validCode,
        current_stage: 'code_generation'
      };

      simulateGeneratedCodeHandling(response, 'gather_requirements', mockSetGeneratedCode, mockLogTerminal);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(mockSetGeneratedCode).toHaveBeenCalledWith(validCode);
      expect(logMessages).toContain(`Generated code updated (${validCode.length} chars) for stage: code_generation`);
    });

    it('should update generated code when valid code is provided in refinement_testing stage', () => {
      let generatedCode = '';
      const mockSetGeneratedCode = vi.fn((code: string) => { generatedCode = code; });

      const refinedCode = `PROGRAM OptimizedMain
VAR
  Counter : DINT := 0;
  SafetyFlag : BOOL := TRUE;
END_VAR

IF SafetyFlag THEN
  Counter := Counter + 1;
END_IF;

END_PROGRAM`;

      const response = {
        generated_code: refinedCode,
        current_stage: 'refinement_testing'
      };

      simulateGeneratedCodeHandling(response, 'code_generation', mockSetGeneratedCode, mockLogTerminal);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(mockSetGeneratedCode).toHaveBeenCalledWith(refinedCode);
      expect(logMessages).toContain(`Generated code updated (${refinedCode.length} chars) for stage: refinement_testing`);
    });

    it('should update generated code in non-generation stages without assertions', () => {
      let generatedCode = '';
      const mockSetGeneratedCode = vi.fn((code: string) => { generatedCode = code; });

      const someCode = 'VAR test : BOOL; END_VAR';

      const response = {
        generated_code: someCode,
        current_stage: 'gathering_requirements'
      };

      simulateGeneratedCodeHandling(response, 'gather_requirements', mockSetGeneratedCode, mockLogTerminal);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(mockSetGeneratedCode).toHaveBeenCalledWith(someCode);
      expect(logMessages).toContain(`Generated code updated: ${someCode.length} characters`);
    });

    it('should handle empty code gracefully in non-generation stages', () => {
      let generatedCode = '';
      const mockSetGeneratedCode = vi.fn((code: string) => { generatedCode = code; });

      const response = {
        generated_code: '',
        current_stage: 'gathering_requirements'
      };

      simulateGeneratedCodeHandling(response, 'gathering_requirements', mockSetGeneratedCode, mockLogTerminal);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(mockSetGeneratedCode).not.toHaveBeenCalled();
      expect(logMessages).toEqual([]);
    });
  });

  describe('Stage transitions and code persistence', () => {
    it('should use response current_stage over local currentStage for assertions', () => {
      let generatedCode = '';
      const mockSetGeneratedCode = vi.fn((code: string) => { generatedCode = code; });

      const response = {
        generated_code: '', // Empty code
        current_stage: 'code_generation' // Response indicates code generation
      };

      // Local stage is different, but response stage should take precedence
      simulateGeneratedCodeHandling(response, 'gather_requirements', mockSetGeneratedCode, mockLogTerminal);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generated code assertion failed: Expected non-empty code in stage code_generation')
      );
      expect(logMessages).toContain('ERROR: Empty generated_code received in code_generation stage');
    });

    it('should handle undefined current_stage by falling back to local stage', () => {
      let generatedCode = '';
      const mockSetGeneratedCode = vi.fn((code: string) => { generatedCode = code; });

      const response = {
        generated_code: '', // Empty code
        // current_stage is undefined
      };

      simulateGeneratedCodeHandling(response, 'code_generation', mockSetGeneratedCode, mockLogTerminal);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generated code assertion failed: Expected non-empty code in stage code_generation')
      );
      expect(logMessages).toContain('ERROR: Empty generated_code received in code_generation stage');
    });
  });

  describe('Code format validation', () => {
    it('should handle various PLC structured text formats', () => {
      let generatedCode = '';
      const mockSetGeneratedCode = vi.fn((code: string) => { generatedCode = code; });

      const plcFormats = [
        'FUNCTION_BLOCK Motor\nVAR_INPUT\n  Start : BOOL;\nEND_VAR\nEND_FUNCTION_BLOCK',
        'TYPE SafetyLevel : (CAT1, CAT2, CAT3, CAT4); END_TYPE',
        'VAR_GLOBAL\n  SystemReady : BOOL := FALSE;\nEND_VAR',
        '(* Comment *)\nIF Condition THEN\n  Action();\nEND_IF;'
      ];

      plcFormats.forEach((code, index) => {
        const response = {
          generated_code: code,
          current_stage: 'code_generation'
        };

        simulateGeneratedCodeHandling(response, 'gather_requirements', mockSetGeneratedCode, mockLogTerminal);

        expect(mockSetGeneratedCode).toHaveBeenNthCalledWith(index + 1, code);
        expect(logMessages).toContain(`Generated code updated (${code.length} chars) for stage: code_generation`);
      });

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
})