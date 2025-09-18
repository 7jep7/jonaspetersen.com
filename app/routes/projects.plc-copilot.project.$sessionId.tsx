import { useState, useRef, useEffect, createElement } from "react";
import { useParams, Link, useSearchParams } from "@remix-run/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  MessageSquare, 
  FileText, 
  GitBranch, 
  List, 
  Network, 
  Box,
  Terminal,
  Database,
  ChevronDown,
  ChevronRight,
  X,
  Paperclip,
  ArrowLeft,
  SkipForward
} from "lucide-react";
import { Edit } from "lucide-react";
import { apiClient, type ContextResponse, type ProjectContext as ApiProjectContext } from "~/lib/api-client";
import { ConnectionStatus, ErrorMessage } from "~/components/ConnectionStatus";
import { StageIndicator } from "~/components/StageIndicator";
import { Button } from "~/components/ui/button";

// Safe ReactMarkdown wrapper with fallback for Safari compatibility
const SafeReactMarkdown = ({ children, components, ...props }: any) => {
  try {
    // First try with remark-gfm
    return (
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={components}
        {...props}
      >
        {children}
      </ReactMarkdown>
    );
  } catch (error) {
    console.warn('ReactMarkdown with remark-gfm failed, trying without plugins:', error);
    
    try {
      // Try without remark-gfm for Safari compatibility
      return (
        <ReactMarkdown 
          components={components}
          {...props}
        >
          {children}
        </ReactMarkdown>
      );
    } catch (fallbackError) {
      // Final fallback for Safari/iOS compatibility issues
      console.warn('ReactMarkdown completely failed, falling back to formatted text:', fallbackError);
      
      // Try to provide a better fallback by rendering basic formatting
      const processText = (text: string) => {
        return text
          // Convert **bold** to <strong>
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          // Convert single *italic* (avoiding double ** which was already processed)
          .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
          // Convert `code` to <code>
          .replace(/`(.*?)`/g, '<code style="background: #374151; padding: 0.125rem 0.25rem; border-radius: 0.25rem;">$1</code>')
          // Convert line breaks
          .replace(/\n/g, '<br />');
      };
      
      return (
        <div 
          className="whitespace-pre-wrap text-gray-300"
          dangerouslySetInnerHTML={{ 
            __html: processText(children || '') 
          }}
        />
      );
    }
  }
};

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  hasFiles?: boolean;
  attachedFiles?: { name: string; type: string }[]; // Store file info with message
  mcqOptions?: string[]; // MCQ options for assistant messages
  isMultiSelect?: boolean; // Whether MCQ allows multiple selections
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string | null;
}

// Helper functions to convert between UI format and API format
const convertDeviceConstantsToApiFormat = (deviceConstants: DeviceConstant[]): Record<string, any> => {
  const result: Record<string, any> = {};
  deviceConstants.forEach(constant => {
    const fullPath = [...constant.path, constant.name];
    let current = result;
    
    // Navigate to the right location in the nested object
    for (let i = 0; i < fullPath.length - 1; i++) {
      const key = fullPath[i];
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    
    // Set the final value
    current[fullPath[fullPath.length - 1]] = constant.value;
  });
  return result;
};

const convertApiFormatToDeviceConstants = (device_constants: Record<string, any>): DeviceConstant[] => {
  const result: DeviceConstant[] = [];
  
  const traverse = (obj: any, currentPath: string[] = []) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        traverse(value, [...currentPath, key]);
      } else {
        result.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          path: currentPath,
          name: key,
          value: String(value),
          source: 'api'
        });
      }
    });
  };
  
  traverse(device_constants);
  return result;
};

interface DeviceConstant {
  id: string;
  path: string[];  // e.g., ["Device", "Vendor"] for hierarchical display
  name: string;
  value: string;
  source?: string; // e.g., "datasheet", "conversation", "manual"
}

interface ProjectContext {
  device_constants: Record<string, any>; // Matches API format
  information: string; // Markdown text with notes and bullet points
  // Keep the legacy deviceConstants for UI purposes, will sync with device_constants
  deviceConstants: DeviceConstant[];
}

type OutputView = "chat" | "logs" | "context" | "structured-text" | "function-block" | "sequential-chart" | "signal-mapping" | "digital-twin";

// WIP tabs - for development process
const wipViews = [
  { id: "logs" as OutputView, icon: Terminal, name: "Logs", shortName: "L", description: "Copilot logs, errors, warnings" },
  { id: "context" as OutputView, icon: Database, name: "Context", shortName: "C", description: "Project context: device constants and gathered information" }
];

// Result tabs - for code generation and refinement
const resultViews = [
  { id: "structured-text" as OutputView, icon: FileText, name: "Structured Text", shortName: "ST", description: "IEC 61131-3 Structured Text programming language" },
  { id: "function-block" as OutputView, icon: GitBranch, name: "Function Block Diagram", shortName: "FBD", description: "Graphical programming with function blocks" },
  { id: "sequential-chart" as OutputView, icon: List, name: "Sequential Function Chart", shortName: "SFC", description: "Sequential control flow programming" },
  { id: "signal-mapping" as OutputView, icon: Network, name: "Signal Mapping", shortName: "MAP", description: "Input/output signal assignments" },
  { id: "digital-twin" as OutputView, icon: Box, name: "Digital Twin", shortName: "DT", description: "3D visualization and simulation" }
];

// Combined array for backward compatibility
const outputViews = [...wipViews, ...resultViews];

export default function PLCCopilotProject() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedMcqOptions, setSelectedMcqOptions] = useState<{[messageId: string]: string[]}>({});
  // Conversation stage management
  const [currentStage, setCurrentStage] = useState<'project_kickoff' | 'gather_requirements' | 'code_generation' | 'refinement_testing' | 'completed'>('gather_requirements');
  const [nextStage, setNextStage] = useState<'project_kickoff' | 'gather_requirements' | 'code_generation' | 'refinement_testing' | 'completed' | undefined>();
  const [stageProgress, setStageProgress] = useState<{ confidence?: number }>({});
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [generateWarning, setGenerateWarning] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<OutputView>(() => {
    // Determine initial view while respecting mobile UX:
    // - On mobile (width < 1024) default to 'chat'
    // - On non-mobile, if starting in kickoff/gather_requirements, show 'context' to avoid a flash
    const initialStage: string = 'gather_requirements'; // default stage when component mounts
    try {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
      if (isMobile) return 'chat';
      if (initialStage === 'project_kickoff' || initialStage === 'gather_requirements') {
        return 'context';
      }
      return 'structured-text';
    } catch {
      // If window isn't available (SSR), default to structured-text to be safe
      if (initialStage === 'project_kickoff' || initialStage === 'gather_requirements') {
        return 'context';
      }
      return 'structured-text';
    }
  });

  // New-constant input state (separate name and value fields)
  const [newConstantPath, setNewConstantPath] = useState<string>("Device");
  const [newConstantName, setNewConstantName] = useState<string>("");
  const [newConstantValue, setNewConstantValue] = useState<string>("");

  const addDeviceConstant = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const name = newConstantName?.trim();
    const value = newConstantValue?.trim();

    if (!name || !value) {
      logTerminal('Failed to add device constant - name and value are required');
      return;
    }

    // Parse the name for dot notation (e.g., "Device.Interface.Type" -> path: ["Device", "Interface"], name: "Type")
    const nameParts = name.split('.').map(p => p.trim()).filter(Boolean);
    
    let pathParts: string[];
    let actualName: string;
    
    if (nameParts.length > 1) {
      // Multi-level: last part is name, rest is path
      actualName = nameParts.pop() || name;
      pathParts = nameParts;
    } else {
      // Single level: top-level constant (empty path)
      actualName = name;
      pathParts = []; // Top-level
    }

    const newConst: DeviceConstant = {
      id: Date.now().toString(),
      path: pathParts,
      name: actualName,
      value,
      source: 'manual'
    };

    setProjectContext(prev => {
      const newDeviceConstants = [...prev.deviceConstants, newConst];
      return {
        ...prev,
        deviceConstants: newDeviceConstants,
        device_constants: convertDeviceConstantsToApiFormat(newDeviceConstants)
      };
    });

    logTerminal(`Added device constant: ${pathParts.join('.')}.${actualName} = ${value}`);

    // Reset Name/Value inputs (keep path)
    setNewConstantName('');
    setNewConstantValue('');
  };
  const [initialApiCall, setInitialApiCall] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [apiCallInProgress, setApiCallInProgress] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [contextLoaded, setContextLoaded] = useState(false); // Track if context has been loaded from localStorage
  const [isEditingInformation, setIsEditingInformation] = useState(false); // Toggle between edit and preview mode for information field
  
  // Context state
  const [projectContext, setProjectContext] = useState<ProjectContext>(() => {
    // Start with empty device constants and information. Device constants will be
    // populated from user inputs, datasheet parsing or API responses.
    const deviceConstants: DeviceConstant[] = [];
    const information = "";

    return {
      deviceConstants,
      device_constants: {},
      information
    };
  });

  // Local editable information input (starts empty)
  const [informationInput, setInformationInput] = useState<string>("");

  // Collapsed state for hierarchy nodes (keyed by dot-path like 'Device' or 'Device.Interface')
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Inline edit state for device constants
  const [editingConstantId, setEditingConstantId] = useState<string | null>(null);
  const [editConstantName, setEditConstantName] = useState<string>("");
  const [editConstantValue, setEditConstantValue] = useState<string>("");

  // Placeholder text for Information field that gets cleared before API calls
  const informationPlaceholder = "No device constants gathered yet. Information will be extracted from datasheets and conversations.";

  // Helper function to clean context before API calls (removes placeholder text)
  const getCleanedProjectContext = () => {
    return {
      ...projectContext,
      information: projectContext.information === informationPlaceholder ? "" : projectContext.information
    };
  };

  const toggleNode = (path: string) => {
    setCollapsedNodes(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // Delete a device constant by id
  const deleteDeviceConstant = (id: string) => {
    setProjectContext(prev => {
      const newDeviceConstants = prev.deviceConstants.filter(dc => dc.id !== id);
      return {
        ...prev,
        deviceConstants: newDeviceConstants,
        device_constants: convertDeviceConstantsToApiFormat(newDeviceConstants)
      };
    });
    logTerminal(`Deleted device constant ${id}`);
  };

  const startEditConstant = (constant: DeviceConstant) => {
    const fullName = [...(constant.path || []), constant.name].join('.');
    setEditingConstantId(constant.id);
    setEditConstantName(fullName);
    setEditConstantValue(constant.value);
  };

  const cancelEditConstant = () => {
    setEditingConstantId(null);
    setEditConstantName("");
    setEditConstantValue("");
  };

  const saveEditConstant = (id: string) => {
    const nameTrim = editConstantName.trim();
    const valueTrim = editConstantValue.trim();
    if (!nameTrim || !valueTrim) {
      logTerminal('Edit cancelled - name and value required');
      return;
    }

    const parts = nameTrim.split('.').map(p => p.trim()).filter(Boolean);
    let newPath: string[] = [];
    let newName = nameTrim;
    if (parts.length > 1) {
      newName = parts.pop() as string;
      newPath = parts;
    } else {
      newPath = [];
      newName = parts[0] || nameTrim;
    }

    setProjectContext(prev => {
      const newDeviceConstants = prev.deviceConstants.map(dc => 
        dc.id === id ? { ...dc, path: newPath, name: newName, value: valueTrim, source: 'manual' } : dc
      );
      return {
        ...prev,
        deviceConstants: newDeviceConstants,
        device_constants: convertDeviceConstantsToApiFormat(newDeviceConstants)
      };
    });

    logTerminal(`Edited device constant ${id} -> ${[...newPath, newName].join('.')} = ${valueTrim}`);
    cancelEditConstant();
  };

  // Helper function to convert UI stage to API stage
  const convertStageToApiFormat = (stage: typeof currentStage): string => {
    const stageMapping: Record<typeof currentStage, string> = {
      'project_kickoff': 'gathering_requirements',
      'gather_requirements': 'gathering_requirements',
      'code_generation': 'code_generation',
      'refinement_testing': 'refinement_testing',
      'completed': 'refinement_testing'
    };
    return stageMapping[stage] || 'gathering_requirements';
  };

  // Helper function to get the previous copilot message for API context
  const getPreviousCopilotMessage = (): string | undefined => {
    // For project_kickoff stage, there should be no previous message
    if (currentStage === 'project_kickoff') {
      return undefined;
    }
    
    // Find the last assistant message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return messages[i].content;
      }
    }
    
    return undefined;
  };

  const logTerminal = (line: string) => {
    setTerminalLogs((t) => [...t, `[${new Date().toLocaleTimeString()}] ${line}`]);
  };

  // Return a very concise description of how the current stage modifies the prompt
  const buildPromptModifier = (stage: typeof currentStage) => {
    switch (stage) {
      case 'project_kickoff':
        return 'focus=high-level goals, constraints';
      case 'gather_requirements':
        return 'focus=ask clarifying Qs, gather IO, constraints';
      case 'code_generation':
        return 'focus=produce ST/FBD/SFC artifacts, include types';
      case 'refinement_testing':
        return 'focus=test-cases, optimize, fix issues';
      case 'completed':
        return 'focus=final checks, documentation';
      default:
        return 'focus=general';
    }
  };

  // Very small heuristic to parse an MCQ out of assistant content
  const parseMCQ = (text: string) => {
    // look for lines that start with A), 1), -, or similar after a header like 'Options' or 'Choices'
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    // try to find a block that looks like options
    const optionLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (/^(options|choices)[:]?$/i.test(l)) {
        // take subsequent lines until a blank or non-option
        for (let j = i+1; j < lines.length; j++) {
          const candidate = lines[j];
          if (/^([A-Z]\)|\d\.|-|\u2022)\s*/.test(candidate)) {
            optionLines.push(candidate.replace(/^([A-Z]\)|\d\.|-|\u2022)\s*/, '').trim());
          } else if (/^[A-Z]\)\s*/.test(candidate)) {
            optionLines.push(candidate.replace(/^[A-Z]\)\s*/, '').trim());
          } else {
            break;
          }
        }
        break;
      }
    }

    // fallback: detect if first few lines look like 'A) ...' or '1. ...'
    if (optionLines.length === 0) {
      for (let i = 0; i < Math.min(lines.length, 12); i++) {
        const m = lines[i].match(/^([A-Z]|\d+)[\)\.]\s+(.*)$/);
        if (m) optionLines.push(m[2].trim());
      }
    }

    if (optionLines.length >= 2) return optionLines;
    return null;
  };
  const [sidebarWidth, setSidebarWidth] = useState(25); // 25% default (1:3 ratio)
  const [filesLoaded, setFilesLoaded] = useState(false); // Track if files have been loaded from localStorage
  
  // ...existing code...

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiCallInProgressRef = useRef(false);
  const resizingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load uploaded files from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFiles = localStorage.getItem('plc_copilot_uploaded_files');
      if (savedFiles) {
        try {
          const parsedFiles = JSON.parse(savedFiles);
          setUploadedFiles(parsedFiles);
        } catch (error) {
          console.error('Failed to parse uploaded files from localStorage:', error);
        }
      }
      setFilesLoaded(true); // Mark files as loaded (even if empty)
    }
  }, []);

  // Load persisted project context (device constants + information) for this session from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const key = `plc_copilot_context_${sessionId ?? 'default'}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: ProjectContext = JSON.parse(raw);
        // Only override if parsed looks valid
        if (parsed && Array.isArray(parsed.deviceConstants)) {
          setProjectContext(parsed);
          setInformationInput(parsed.information || "");
          logTerminal(`Loaded persisted project context (${parsed.deviceConstants.length} constants)`);
        }
      } else {
        // If no persisted context, initialize informationInput from default projectContext.information
        setInformationInput(prev => prev || projectContext.information || "");
      }
    } catch (err) {
      console.error('Failed to load persisted project context:', err);
    } finally {
      setContextLoaded(true); // Mark context as loaded regardless of success/failure
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Append lastError into terminal logs for quick visibility
  useEffect(() => {
    if (lastError) {
      setTerminalLogs((t) => [...t, `[${new Date().toLocaleTimeString()}] ERROR: ${lastError}`]);
    }
  }, [lastError]);

  // Set initial input from URL prompt if input is empty
  useEffect(() => {
    if (initialPrompt && input === "") {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  // Handle initial prompt from URL (wait for uploadedFiles to be loaded first)
  useEffect(() => {
    if (initialPrompt && !initialApiCall && messages.length === 0 && filesLoaded) {
      setInitialApiCall(true);
      // Clear the input field since this will be sent automatically
      setInput("");
      const initialMessage: Message = {
        id: Date.now().toString(),
        content: initialPrompt,
        role: "user",
        timestamp: new Date(),
        hasFiles: uploadedFiles.length > 0,
        attachedFiles: uploadedFiles.map(f => ({ name: f.name, type: f.type }))
      };
      setMessages([initialMessage]);
      
      // Clear uploaded files state AND localStorage after creating initial message
      setUploadedFiles([]);
      localStorage.removeItem('plc_copilot_uploaded_files');
      
      // Trigger API call for initial prompt
      sendMessage(initialMessage);
    }
  }, [initialPrompt, initialApiCall, messages.length, filesLoaded, uploadedFiles]);

  const sendMessage = async (userMessage: Message) => {
    // Prevent multiple simultaneous API calls
    if (apiCallInProgressRef.current) {
      console.log('API call already in progress, skipping');
      return;
    }

    apiCallInProgressRef.current = true;
    setIsLoading(true);
    setApiCallInProgress(true);
    setLastError(null);

    try {
    // Log outgoing LLM request (concise)
    const cleanedContext = getCleanedProjectContext();
    const previousMessage = getPreviousCopilotMessage();
    logApiSummary('SEND', userMessage.content, cleanedContext, previousMessage);
      // Call the new context API - works for both initial and follow-up messages
      const response: ContextResponse = await apiClient.updateContext(
        getCleanedProjectContext(),
        convertStageToApiFormat(currentStage),
        userMessage.content,
        undefined, // mcqResponses
        uploadedFiles.length > 0 ? uploadedFiles.map(f => {
          // Convert UploadedFile to File object for API
          const blob = new Blob([f.content || ''], { type: f.type });
          const file = new File([blob], f.name, { type: f.type });
          return file;
        }) : undefined,
        getPreviousCopilotMessage() // previous copilot message for context
      );

  // Log brief response summary
  logApiSummary('RECV', response.chat_message, response.updated_context);

      // Update context from backend response
      updateContextFromResponse(response);
      
      // Update project context from API response
      setProjectContext(prev => ({
        ...response.updated_context,
        deviceConstants: convertApiFormatToDeviceConstants(response.updated_context.device_constants)
      }));
      
      // Update stage if changed
      // Map API stage names to UI stage names for comparison
      const stageMapping: Record<string, typeof currentStage> = {
        'gathering_requirements': 'gather_requirements',
        'code_generation': 'code_generation',
        'refinement_testing': 'refinement_testing'
      };
      const mappedStage = stageMapping[response.current_stage] || response.current_stage as typeof currentStage;
      
      if (mappedStage !== currentStage) {
        handleStageTransition(mappedStage, 'Backend updated stage');
      }
      
      // Update progress if provided
      if (response.gathering_requirements_progress !== undefined) {
        setStageProgress({ confidence: response.gathering_requirements_progress });
      }
      
      // Check if response contains MCQ and extract options
      const mcqOptions = response.is_mcq ? response.mcq_options : null;
      if (mcqOptions && mcqOptions.length > 0) {
        logTerminal(`MCQ detected: ${mcqOptions.length} options [${mcqOptions.map(opt => opt.slice(0, 30)).join(', ')}${mcqOptions.some(opt => opt.length > 30) ? '...' : ''}]`);
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.chat_message,
        role: "assistant",
        timestamp: new Date(),
        mcqOptions: mcqOptions || undefined,
        isMultiSelect: response.is_multiselect
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('API call failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(errorMessage);
      
      // Fallback message on error
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting to the backend right now. Please check your connection or try again later. In the meantime, I can help you with general PLC programming guidance.",
        role: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
      setApiCallInProgress(false);
      apiCallInProgressRef.current = false;
    }
  };

  // Utility: strip simple markdown from MCQ option strings so backend receives clean text
  const stripMarkdown = (s: string) => {
    if (!s) return s;
    // Remove bold/italic/inline code markers and links: **bold**, __bold__, *italic*, _italic_, `code`, [text](url)
    return s
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .trim();
  };

  // Helper function to update context from backend response
  const updateContextFromResponse = (response: ContextResponse) => {
    if (response.updated_context) {
      // Convert the backend nested format to UI format for device constants
      const backendDeviceConstants = response.updated_context.device_constants || {};
      const uiDeviceConstants = convertApiFormatToDeviceConstants(backendDeviceConstants);
      
      // Update project context with backend data
      setProjectContext(prev => ({
        ...prev,
        device_constants: backendDeviceConstants,
        deviceConstants: uiDeviceConstants,
        information: response.updated_context.information || ""
      }));
      
      // Update information input field
      setInformationInput(response.updated_context.information || "");
      
      // Log context update
      logTerminal(`Context updated from backend: ${Object.keys(backendDeviceConstants).length} device groups, ${(response.updated_context.information || "").length} chars info`);
    }

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

  // Helper function to intelligently truncate context for logging
  const truncateContext = (context: any, maxLength: number = 200): string => {
    try {
      // For logging, focus on the API format (device_constants) to avoid duplication
      const cleanContext = {
        device_constants: context.device_constants || {},
        information: context.information || ""
      };
      const contextStr = JSON.stringify(cleanContext);
      if (contextStr.length <= maxLength) return contextStr;
      
      // Try to show structure while keeping it brief
      const deviceConstantsCount = Object.keys(context.device_constants || {}).length;
      const infoLength = (context.information || "").length;
      
      return `{device_constants: ${deviceConstantsCount} items, information: ${infoLength} chars}`;
    } catch {
      return "{context truncation error}";
    }
  };

  // Compact API summary logger used to produce a single-line send/receive entry
  const logApiSummary = (direction: 'SEND' | 'RECV', contentSnippet: string, context?: any, previousCopilotMessage?: string) => {
    const ts = new Date().toLocaleTimeString();
    const short = contentSnippet.replace(/\s+/g, ' ').trim().slice(0, 80);
    const contextSummary = context ? ` | CTX: ${truncateContext(context)}` : '';
    
    // Add previous copilot message info for SEND operations (truncated)
    const prevMsgSummary = direction === 'SEND' && previousCopilotMessage 
      ? ` | PREV: ${previousCopilotMessage.replace(/\s+/g, ' ').trim().slice(0, 40)}${previousCopilotMessage.length > 40 ? '…' : ''}`
      : '';
    
    logTerminal(`${direction} ${ts} ${short}${contentSnippet.length > 80 ? '…' : ''}${contextSummary}${prevMsgSummary}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine the active assistant message whose MCQ selections should be submitted.
    // UI only allows interacting with the most recent assistant MCQ, so we should only
    // send selections for that message to avoid leaking earlier answers.
    const allSelectedOptions: string[] = [];
    const mcqSelectionMessages: string[] = [];

    // Find the latest assistant message that has MCQ options and is interactive
    let activeAssistantMessageId: string | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === 'assistant' && m.mcqOptions && m.mcqOptions.length > 0) {
        // The UI treats the latest assistant (or the one directly before the latest user
        // message) as the interactive MCQ. We'll pick this message id as the active one.
        activeAssistantMessageId = m.id;
        break;
      }
    }

    if (activeAssistantMessageId) {
      const selections = selectedMcqOptions[activeAssistantMessageId] || [];
      if (selections.length > 0) {
        allSelectedOptions.push(...selections);
        mcqSelectionMessages.push(`Selected options: ${selections.join(', ')}`);
      }
    }
    
    // Require either text input or MCQ selections
    if (!input.trim() && allSelectedOptions.length === 0) {
      return;
    }
    
    if (isLoading) return;

    // Handle MCQ-only submissions (no user message created)
  if (!input.trim() && allSelectedOptions.length > 0) {
      // Clear inputs but keep MCQ selections visible
      setInput("");
      setUploadedFiles([]);
      localStorage.removeItem('plc_copilot_uploaded_files');
      
      setIsLoading(true);
      setApiCallInProgress(true);
      setLastError(null);
      
      logTerminal(`MCQ-only submission: ${allSelectedOptions.length} options selected, continuing conversation flow`);

      try {
        // Construct MCQ selections for API
  const stripped = allSelectedOptions.map(o => stripMarkdown(o));

        logApiSummary('SEND', `MCQ_SELECTIONS: ${stripped.join(' ||| ')}`, getCleanedProjectContext(), getPreviousCopilotMessage());

        const response: ContextResponse = await apiClient.updateContext(
          getCleanedProjectContext(),
          convertStageToApiFormat(currentStage),
          undefined, // no message
          stripped, // mcqResponses
          undefined, // no files
          getPreviousCopilotMessage() // previous copilot message for context
        );

        logApiSummary('RECV', response.chat_message, response.updated_context);

        // Update context from backend response
        updateContextFromResponse(response);
        
        // Update project context from API response
        setProjectContext(prev => ({
          ...response.updated_context,
          deviceConstants: convertApiFormatToDeviceConstants(response.updated_context.device_constants)
        }));
        
        // Update stage if changed
        // Map API stage names to UI stage names for comparison
        const stageMapping: Record<string, typeof currentStage> = {
          'gathering_requirements': 'gather_requirements',
          'code_generation': 'code_generation',
          'refinement_testing': 'refinement_testing'
        };
        const mappedStage = stageMapping[response.current_stage] || response.current_stage as typeof currentStage;
        
        if (mappedStage !== currentStage) {
          handleStageTransition(mappedStage, 'Backend updated stage');
        }
        
        // Update progress if provided
        if (response.gathering_requirements_progress !== undefined) {
          setStageProgress({ confidence: response.gathering_requirements_progress });
        }
        
        // Check if response contains MCQ and extract options
        const mcqOptions = response.is_mcq ? response.mcq_options : null;
        if (mcqOptions && mcqOptions.length > 0) {
          logTerminal(`MCQ detected: ${mcqOptions.length} options [${mcqOptions.map(opt => opt.slice(0, 30)).join(', ')}${mcqOptions.some(opt => opt.length > 30) ? '...' : ''}]`);
        }
        
        const assistantMessage: Message = {
          id: Date.now().toString(),
          content: response.chat_message,
          role: "assistant",
          timestamp: new Date(),
          mcqOptions: mcqOptions || undefined,
          isMultiSelect: response.is_multiselect
        };
        setMessages(prev => [...prev, assistantMessage]);
        
      } catch (error) {
        console.error('API call failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setLastError(errorMessage);
        
        const errorResponse: Message = {
          id: Date.now().toString(),
          content: `Error: ${errorMessage}. Please try again.`,
          role: "assistant",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
        setApiCallInProgress(false);
      }
      
      return; // Exit early for MCQ-only submissions
    }

    // Handle text submissions (with optional MCQ selections)
    // Show only the user's typed text in the UI. If MCQ selections exist, send them to the backend
    // as additional context but don't duplicate them in the visible user message.
    const visibleContent = input.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      content: visibleContent,
      role: "user",
      timestamp: new Date(),
      hasFiles: uploadedFiles.length > 0,
      attachedFiles: uploadedFiles.map(f => ({ name: f.name, type: f.type }))
    };

    // Add only the typed message to the UI
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setUploadedFiles([]);
    localStorage.removeItem('plc_copilot_uploaded_files');

    // Log MCQ selections if present (they will be sent to the backend but not shown in the UI)
    if (allSelectedOptions.length > 0) {
      logTerminal(`MCQ submission: ${allSelectedOptions.length} options submitted with message`);
    }

    setIsLoading(true);
    setApiCallInProgress(true);
    setLastError(null);

    try {
      // Prepare MCQ context if selections exist
      const stripped = allSelectedOptions.length > 0 ? allSelectedOptions.map(o => stripMarkdown(o)) : [];

      // Log outgoing LLM request for submitted input (compact)
      const previousMessage = getPreviousCopilotMessage();
      logApiSummary('SEND', `${stripped.length > 0 ? `MCQ: ${stripped.join(', ')} + ` : ''}${visibleContent}`, getCleanedProjectContext(), previousMessage);

      // Call the new context API - include MCQ selections
      const response: ContextResponse = await apiClient.updateContext(
        getCleanedProjectContext(),
        convertStageToApiFormat(currentStage),
        visibleContent,
        stripped.length > 0 ? stripped : undefined, // mcqResponses
        uploadedFiles.length > 0 ? uploadedFiles.map(f => {
          // Convert UploadedFile to File object for API
          const blob = new Blob([f.content || ''], { type: f.type });
          const file = new File([blob], f.name, { type: f.type });
          return file;
        }) : undefined,
        getPreviousCopilotMessage() // previous copilot message for context
      );
      
      logApiSummary('RECV', response.chat_message, response.updated_context);

      // Update context from backend response
      updateContextFromResponse(response);

      // Update project context from API response
      setProjectContext(prev => ({
        ...response.updated_context,
        deviceConstants: convertApiFormatToDeviceConstants(response.updated_context.device_constants)
      }));
      
      // Update stage if changed
      // Map API stage names to UI stage names for comparison
      const stageMapping: Record<string, typeof currentStage> = {
        'gathering_requirements': 'gather_requirements',
        'code_generation': 'code_generation',
        'refinement_testing': 'refinement_testing'
      };
      const mappedStage = stageMapping[response.current_stage] || response.current_stage as typeof currentStage;
      
      if (mappedStage !== currentStage) {
        handleStageTransition(mappedStage, 'Backend updated stage');
      }
      
      // Update progress if provided
      if (response.gathering_requirements_progress !== undefined) {
        setStageProgress({ confidence: response.gathering_requirements_progress });
      }
      
      // Update generated code if provided
      // Check if response contains MCQ and extract options
      const mcqOptions = response.is_mcq ? response.mcq_options : null;
      if (mcqOptions && mcqOptions.length > 0) {
        logTerminal(`MCQ detected: ${mcqOptions.length} options [${mcqOptions.map(opt => opt.slice(0, 30)).join(', ')}${mcqOptions.some(opt => opt.length > 30) ? '...' : ''}]`);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.chat_message,
        role: "assistant",
        timestamp: new Date(),
        mcqOptions: mcqOptions || undefined,
        isMultiSelect: response.is_multiselect
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('API call failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(errorMessage);
      
      // Fallback message on error
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting to the backend right now. Please check your connection or try again later. In the meantime, I can help you with general PLC programming guidance.",
        role: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
      setApiCallInProgress(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only allow Enter to submit on desktop (lg screens and above)
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth >= 1024) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleKeyDownMobile = (e: React.KeyboardEvent) => {
    // On mobile, Enter key does not submit - only the button does
    // This allows for multiline text input without accidental submission
  };

  // Handle sidebar resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    
    const containerWidth = window.innerWidth;
    const newWidth = (e.clientX / containerWidth) * 100;
    
    // Constrain between 20% and 60%
    const constrainedWidth = Math.min(Math.max(newWidth, 20), 60);
    setSidebarWidth(constrainedWidth);
  };

  const handleMouseUp = () => {
    resizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(async (file) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      let content: string | null = null;
      try {
        content = await file.text();
      } catch (err) {
        content = null;
      }

      const uploadedFile: UploadedFile = {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        content
      };

      setUploadedFiles(prev => {
        const next = [...prev, uploadedFile];
        return next;
      });

      setSelectedFileId(id);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle stage transitions for the conversation flow
  const handleStageTransition = (newStage: typeof currentStage, reason?: string) => {
    // Log the stage transition succinctly and then perform it
    logTerminal(`STAGE: ${currentStage} -> ${newStage}${reason ? ` (${reason})` : ''}`);
    setCurrentStage(newStage);
    
    // Auto-switch to Structured Text view when entering code generation stage
    if (newStage === 'code_generation' && activeView !== 'structured-text') {
      setActiveView('structured-text');
      logTerminal(`AUTO-SWITCH: View changed to Structured Text for code generation stage`);
    }
    
    // Here you could add API calls to update the backend stage
    console.log(`Stage transition: ${currentStage} -> ${newStage}`, reason);
  };

  // When entering the gather_requirements stage, open the Context results tab
  useEffect(() => {
    try {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
      // Only auto-switch to Context on non-mobile (desktop/tablet) devices
      if (!isMobile && (currentStage === 'gather_requirements' || currentStage === 'project_kickoff')) {
        if (activeView !== 'context') {
          setActiveView('context');
          logTerminal(`AUTO-SWITCH: View changed to Context for ${currentStage} stage`);
        }
      }
    } catch (err) {
      // If any issue determining viewport, fall back to previous behavior
      if (currentStage === 'gather_requirements' || currentStage === 'project_kickoff') {
        if (activeView !== 'context') {
          setActiveView('context');
          logTerminal(`AUTO-SWITCH: View changed to Context for ${currentStage} stage`);
        }
      }
    }
  }, [currentStage]);

  // Handle skip to code button - sends a message and transitions stage
  const handleSkipToCode = async () => {
    if (isLoading || apiCallInProgress) return; // Prevent if already processing
    
    const skipMessage: Message = {
      id: Date.now().toString(),
      content: "Generate Structured Text for a PLC now.",
      role: "user",
      timestamp: new Date(),
      hasFiles: false
    };

    // Add the message to UI first
    setMessages(prev => [...prev, skipMessage]);
    
    // Transition to code generation stage
    handleStageTransition('code_generation', 'User clicked Skip to Code button');
    
    // Send the message to get LLM response
    await sendMessage(skipMessage);
  };

  // Handler for mobile 'Generate' button which should check stage progress
  const handleGenerateClick = async () => {
    // minimum required confidence (backend: gathering_requirements_estimated_progress)
    const minConfidence = 0.5;
    const confidence = stageProgress?.confidence ?? 0;
    if (confidence < minConfidence) {
      setGenerateWarning('Provide a bit more project information before generating code.');
      setTimeout(() => setGenerateWarning(null), 3000);
      return;
    }

    // If sufficient progress, behave like Skip to Code
    await handleSkipToCode();
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    setSelectedFileId((current) => (current === fileId ? null : current));
  };

  // Load persisted files from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('plc_copilot_uploaded_files');
      if (raw) setUploadedFiles(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  // Persist uploadedFiles to localStorage (only after initial load)
  useEffect(() => {
    if (!filesLoaded) return; // Don't persist until files are loaded from localStorage
    try {
      localStorage.setItem('plc_copilot_uploaded_files', JSON.stringify(uploadedFiles));
    } catch (e) {
      console.error('Session page: Failed to persist files:', e);
    }
  }, [uploadedFiles, filesLoaded]);

  // Persist projectContext to localStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined' || !contextLoaded) return;
    try {
      const key = `plc_copilot_context_${sessionId ?? 'default'}`;
      localStorage.setItem(key, JSON.stringify(projectContext));
      logTerminal(`Persisted project context (${projectContext.deviceConstants.length} constants)`);
    } catch (e) {
      console.error('Failed to persist project context:', e);
    }
  }, [projectContext, sessionId, contextLoaded]);

  // Cleanup resize event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const renderOutputContent = () => {
    switch (activeView) {
      case "structured-text":
        return (
          <div className="h-full p-6 flex flex-col min-h-0">
            <div className="font-mono text-sm bg-gray-900 rounded-lg flex flex-col min-h-0 flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                <pre className="text-gray-200 whitespace-pre-wrap break-words">
                  {generatedCode || `// No code generated yet
// PLC Copilot will generate Structured Text code here
// based on your requirements and device context.

// Example placeholder:
PROGRAM ConveyorControl
VAR
    bStart          : BOOL := FALSE;      // Start button
    bStop           : BOOL := FALSE;      // Stop button  
    bEmergencyStop  : BOOL := FALSE;      // E-stop
    bMotorRunning   : BOOL := FALSE;      // Motor status
    bSafetyOK       : BOOL := TRUE;       // Safety check
    
    // Inputs
    bStartButton    : BOOL;
    bStopButton     : BOOL;
    bEStop          : BOOL;
    bSafetyGate     : BOOL;
    
    // Outputs
    qMotorContactor : BOOL;
    qStatusLight    : BOOL;
END_VAR

// Main control logic
IF bEStop OR NOT bSafetyGate THEN
    bSafetyOK := FALSE;
    qMotorContactor := FALSE;
    bMotorRunning := FALSE;
ELSE
    bSafetyOK := TRUE;
END_IF;

// Start/Stop logic
IF bStartButton AND bSafetyOK AND NOT bMotorRunning THEN
    bStart := TRUE;
ELSIF bStopButton OR NOT bSafetyOK THEN
    bStart := FALSE;
END_IF;

// Motor control
IF bStart AND bSafetyOK THEN
    qMotorContactor := TRUE;
    bMotorRunning := TRUE;
ELSE
    qMotorContactor := FALSE;
    bMotorRunning := FALSE;
END_IF;

// Status indication
qStatusLight := bMotorRunning;

END_PROGRAM`}
                </pre>
              </div>
            </div>
          </div>
        );
      case "logs":
        return (
          <div className="h-full p-6 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-orange-500" />
                <h2 className="text-sm font-semibold">Copilot Logs</h2>
                <p className="text-xs text-gray-400">Logs, errors and warnings</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { navigator.clipboard?.writeText(terminalLogs.join('\n')); }}
                  className="text-xs text-gray-300 hover:text-white px-2 py-1 border border-gray-800 rounded bg-gray-900"
                >
                  Copy
                </button>
                <button
                  onClick={() => setTerminalLogs([])}
                  className="text-xs text-gray-300 hover:text-white px-2 py-1 border border-gray-800 rounded bg-gray-900"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex-1 bg-black bg-opacity-60 rounded-lg border border-gray-800 font-mono text-sm overflow-y-auto p-4 min-h-0">
              {terminalLogs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Errors and warnings will appear here.</div>
              ) : (
                <pre className="text-gray-200 whitespace-pre-wrap break-words">{terminalLogs.join('\n')}</pre>
              )}
            </div>
          </div>
        );
      case "context":
        return (
          <div className="h-full p-6 flex flex-col min-h-0">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-orange-500" />
              <h2 className="text-sm font-semibold">Project Context</h2>
              <p className="text-xs text-gray-400">Device constants and gathered information</p>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
              {/* Device Constants Section - Left Side */}
              <div className="flex-1 min-h-0">
                <div className="mb-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-gray-300" />
                        <div>
                          <div className="text-sm font-medium text-gray-300">Device Constants</div>
                        </div>
                      </div>
                      <div />
                    </div>
                  </div>
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 overflow-y-auto h-full">
                  {/* Inputs inside the hierarchy widget */}
                  <form onSubmit={(e) => addDeviceConstant(e)} className="mb-1 flex items-center gap-2">
                    {/* Path is fixed to 'Device' for now */}
                    <input type="hidden" value={newConstantPath} />
                    <div className="flex gap-2 flex-1 min-w-0">
                      <input
                        value={newConstantName}
                        onChange={(e) => setNewConstantName(e.target.value)}
                        className="flex-1 min-w-0 bg-gray-800 text-gray-200 placeholder-gray-400 px-3 py-1 rounded border border-gray-700 text-sm"
                        placeholder="Device.Interface.Type"
                        title="Constant name with dot notation for hierarchy"
                      />
                      <input
                        value={newConstantValue}
                        onChange={(e) => setNewConstantValue(e.target.value)}
                        className="flex-1 min-w-0 bg-gray-800 text-gray-200 placeholder-gray-400 px-3 py-1 rounded border border-gray-700 text-sm"
                        placeholder="VS-C1500CX"
                        title="Constant value"
                      />
                    </div>
                    <button
                      type="submit"
                      className="flex-shrink-0 text-sm px-3 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white"
                      title="Add device constant"
                    >
                      Add
                    </button>
                  </form>
                  <div className="text-xs text-gray-500">Use dot notation in name field for hierarchy, e.g. <span className="font-mono">Device.Interface.Type</span></div>

                  {projectContext.deviceConstants.length === 0 ? (
                    <div className="text-gray-500 text-sm mt-3">No device constants gathered yet. Information will be extracted from datasheets and conversations.</div>
                  ) : (
                    <div className="space-y-2">
                      {(() => {
                        // Organize constants hierarchically
                        const hierarchy: { [key: string]: any } = {};
                        projectContext.deviceConstants.forEach(constant => {
                          let current = hierarchy;
                          
                          // Navigate through the full path
                          constant.path.forEach((pathPart) => {
                            if (!current[pathPart]) current[pathPart] = {};
                            current = current[pathPart];
                          });
                          
                          // Add the constant at the final level
                          if (!current.__constants) current.__constants = [];
                          current.__constants.push(constant);
                        });

                        // Render hierarchy with alphabetical sorting
                        const renderHierarchy = (obj: any, level = 0, pathPrefix = ''): JSX.Element[] => {
                          const elements: JSX.Element[] = [];

                          // Sort section keys (exclude '__constants')
                          const sectionKeys = Object.keys(obj).filter(k => k !== '__constants').sort((a,b) => a.localeCompare(b));

                          // Render each section with a collapsible header
                          sectionKeys.forEach(key => {
                            const nodePath = pathPrefix ? `${pathPrefix}.${key}` : key;
                            const isCollapsed = !!collapsedNodes[nodePath];
                            const hasChildren = Object.keys(obj[key]).filter(k => k !== '__constants').length > 0;
                            const hasConstants = obj[key].__constants && obj[key].__constants.length > 0;

                            elements.push(
                              <div key={nodePath} className={`${level > 0 ? 'ml-4' : ''}`}>
                                <div 
                                  className="flex items-center gap-2 cursor-pointer select-none hover:bg-gray-800/20 rounded px-1 py-0.5" 
                                  onClick={() => toggleNode(nodePath)}
                                >
                                  {(hasChildren || hasConstants) ? (
                                    isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <div className="w-4 h-4" />
                                  )}
                                  <div className="text-gray-200 font-medium text-sm">{key}</div>
                                </div>
                                {!isCollapsed && (
                                  <div className="ml-2">
                                    {renderHierarchy(obj[key], level + 1, nodePath)}
                                  </div>
                                )}
                              </div>
                            );
                          });

                          // Then render constants at this level, sorted alphabetically
                          if (obj.__constants) {
                            const sortedConsts = [...obj.__constants].sort((a: DeviceConstant, b: DeviceConstant) => a.name.localeCompare(b.name));
                            sortedConsts.forEach((constant: DeviceConstant) => {
                              const isEditing = editingConstantId === constant.id;
                              elements.push(
                                <div key={constant.id} className={`py-1 px-2 rounded text-sm bg-transparent hover:bg-gray-800/40 transition-colors ${level > 0 ? 'ml-4' : ''}`}>
                                  {isEditing ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        value={editConstantName}
                                        onChange={(e) => setEditConstantName(e.target.value)}
                                        className="bg-gray-800 text-gray-200 placeholder-gray-400 px-2 py-1 rounded border border-gray-700 text-sm font-mono"
                                      />
                                      <input
                                        value={editConstantValue}
                                        onChange={(e) => setEditConstantValue(e.target.value)}
                                        className="bg-gray-800 text-gray-200 placeholder-gray-400 px-2 py-1 rounded border border-gray-700 text-sm font-mono"
                                      />
                                      <button onClick={() => saveEditConstant(constant.id)} className="text-xs px-2 py-1 bg-orange-500 rounded text-white">Save</button>
                                      <button onClick={cancelEditConstant} className="text-xs px-2 py-1 text-gray-400">Cancel</button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-300 font-mono">{constant.name}</span>
                                      <span className="text-gray-400 font-mono">:</span>
                                      <span className="text-gray-400 font-mono">{constant.value}</span>
                                      <button onClick={() => startEditConstant(constant)} title="Edit constant" className="ml-2 text-gray-400 hover:text-gray-200 p-1">
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => deleteDeviceConstant(constant.id)}
                                        title="Delete constant"
                                        className="ml-1 text-red-400 hover:text-red-500 p-1"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          }

                          return elements;
                        };

                        return renderHierarchy(hierarchy);
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Information Section - Right Side */}
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Information
                  </h3>
                  <button
                    onClick={() => setIsEditingInformation(!isEditingInformation)}
                    className="text-xs px-2 py-1 border border-gray-700 rounded hover:border-gray-500 text-gray-300 hover:text-white transition-colors"
                  >
                    {isEditingInformation ? 'Preview' : 'Edit'}
                  </button>
                </div>
                <div className="flex-1 bg-gray-900 rounded-lg border border-gray-800 p-4 overflow-y-auto min-h-0">
                  {isEditingInformation ? (
                    <textarea
                      value={informationInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInformationInput(val);
                        setProjectContext(prev => ({ 
                          ...prev, 
                          information: val,
                          device_constants: prev.device_constants // Keep device_constants in sync
                        }));
                      }}
                      placeholder={informationPlaceholder}
                      className="w-full h-full min-h-[200px] bg-transparent resize-none outline-none placeholder-gray-500 text-gray-200 text-sm font-mono"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[200px] prose prose-invert prose-sm max-w-none">
                      {informationInput.trim() === '' || informationInput === informationPlaceholder ? (
                        <div className="text-gray-500 text-sm italic">{informationPlaceholder}</div>
                      ) : (
                        <SafeReactMarkdown
                          components={{
                            // Headers
                            h1: ({node, ...props}) => <h1 className="text-lg font-semibold text-gray-200 mb-3 mt-4 first:mt-0" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-semibold text-gray-200 mb-2 mt-3 first:mt-0" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-gray-200 mb-2 mt-3 first:mt-0" {...props} />,
                            h4: ({node, ...props}) => <h4 className="text-sm font-medium text-gray-200 mb-1 mt-2 first:mt-0" {...props} />,
                            h5: ({node, ...props}) => <h5 className="text-xs font-medium text-gray-200 mb-1 mt-2 first:mt-0" {...props} />,
                            h6: ({node, ...props}) => <h6 className="text-xs font-medium text-gray-300 mb-1 mt-2 first:mt-0" {...props} />,
                            
                            // Text formatting
                            p: ({node, ...props}) => <p className="text-gray-300 mb-3 leading-relaxed" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-gray-200" {...props} />,
                            b: ({node, ...props}) => <b className="font-semibold text-gray-200" {...props} />,
                            em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                            i: ({node, ...props}) => <i className="italic text-gray-300" {...props} />,
                            
                            // Code
                            code: ({node, ...props}) => {
                              const isInline = node?.position?.start?.line === node?.position?.end?.line;
                              if (isInline) {
                                return <code className="bg-gray-800 text-gray-300 px-1 py-0.5 rounded text-sm font-mono" {...props} />;
                              }
                              return <code className="block bg-gray-800 text-gray-300 p-3 rounded-lg overflow-x-auto my-2 font-mono" {...props} />;
                            },
                            pre: ({node, ...props}) => <pre className="bg-gray-800 text-gray-300 p-3 rounded-lg overflow-x-auto my-2 font-mono" {...props} />,
                            
                            // Lists
                            ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1 ml-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1 ml-2" {...props} />,
                            li: ({node, ...props}) => <li className="text-gray-300" {...props} />,
                            
                            // Other elements
                            blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-gray-700 pl-3 text-gray-400 italic my-3" {...props} />,
                            a: ({node, ...props}) => <a className="text-orange-400 hover:text-orange-300 underline" {...props} />,
                            hr: ({node, ...props}) => <hr className="border-0 border-t border-gray-700 my-4" {...props} />,
                            
                            // Tables (GFM support)
                            table: ({node, ...props}) => <table className="border-collapse border border-gray-600 my-3 w-full" {...props} />,
                            thead: ({node, ...props}) => <thead className="bg-gray-800" {...props} />,
                            tbody: ({node, ...props}) => <tbody {...props} />,
                            tr: ({node, ...props}) => <tr className="border-b border-gray-600" {...props} />,
                            th: ({node, ...props}) => <th className="border border-gray-600 px-3 py-2 text-gray-200 font-medium text-left" {...props} />,
                            td: ({node, ...props}) => <td className="border border-gray-600 px-3 py-2 text-gray-300" {...props} />,
                            
                            // Task lists (GFM support)
                            input: ({node, ...props}) => <input className="mr-2" {...props} />,
                            
                            // Line breaks
                            br: ({node, ...props}) => <br {...props} />,
                          }}
                        >
                          {informationInput}
                        </SafeReactMarkdown>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {outputViews.find(v => v.id === activeView)?.icon && 
                  createElement(outputViews.find(v => v.id === activeView)!.icon, { className: "w-8 h-8 text-orange-500" })
                }
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {outputViews.find(v => v.id === activeView)?.name}
              </h3>
              <p className="text-sm">
                {outputViews.find(v => v.id === activeView)?.description}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex-shrink-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              to="/projects/plc-copilot"
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>

              <div>
                <h1 className="text-xl font-semibold">PLC Copilot</h1>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-400">Session {sessionId || 'new'}</p>
                  <ConnectionStatus />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Responsive Layout */}
      <div className="flex-1 flex lg:flex-row flex-col min-h-0 overflow-hidden">
        {/* Desktop: Chat Sidebar | Mobile: Hidden (shown in tabs) */}
        <div 
          className="hidden lg:flex flex-col bg-gray-950 border-r border-gray-800 min-h-0 relative"
          style={{ width: `${sidebarWidth}%` }}
        >
          {/* Messages - Full height scrollable area */}
          <div className="flex-1 overflow-y-auto min-h-0 relative">
            {/* Floating Stage Indicator Header with Frosted Glass Effect */}
            <div className="sticky top-0 px-6 py-3 bg-gray-950/90 backdrop-blur-md min-h-[60px] flex items-center z-10">
              <div className="flex items-center justify-between w-full">
                <StageIndicator 
                  currentStage={currentStage}
                  nextStage={nextStage}
                  confidence={stageProgress?.confidence}
                />
                
                {/* Stage Transition Controls */}
                {currentStage === 'gather_requirements' && (
                  <Button
                    size="sm"
                    onClick={handleSkipToCode}
                    disabled={isLoading || apiCallInProgress}
                    className="border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white text-xs px-2 py-1 ml-3 bg-transparent disabled:opacity-50"
                  >
                    <SkipForward className="w-3 h-3 mr-1 text-gray-400" />
                    <span className="align-middle">Skip to Code</span>
                  </Button>
                )}
              </div>
            </div>
            
            {/* Chat messages with proper padding */}
            <div className="px-6 py-6">
              {/* Files are now shown above individual messages */}
              <div className="space-y-4 max-w-none">
              {messages.map((message, idx) => {
                return (
                <div key={message.id}>
                  {/* File indicators matching index page style - smaller version */}
                  {message.role === "user" && message.hasFiles && (
                    <div className="flex justify-end mb-2">
                      <div className="flex flex-wrap gap-2 justify-end">
                        {(message.attachedFiles || uploadedFiles || []).map((file, fileIdx) => (
                          <div key={fileIdx} className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-2 py-1 text-xs hover:bg-gray-800 transition-all duration-150 group">
                            <FileText className="w-3 h-3 text-gray-300 group-hover:text-gray-100 transition-colors duration-150" />
                            <span className="text-gray-300 font-medium group-hover:text-gray-100 transition-colors duration-150">
                              {file?.name?.slice(0, 5).toUpperCase() || 'FILE'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "user" ? (
                      <div className="max-w-[85%] rounded-lg px-4 py-3 bg-orange-500 text-white">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <time className="text-xs opacity-70 mt-1 block">
                          {message.timestamp.toLocaleTimeString()}
                        </time>
                      </div>
                    ) : (
                      <div className="max-w-[85%] text-gray-100">
                        <SafeReactMarkdown
                          
                          components={{
                            // Headers
                            h1: ({node, ...props}) => <h1 className="text-lg font-semibold text-gray-200 mb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-semibold text-gray-200 mb-2" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-gray-200 mb-1" {...props} />,
                            h4: ({node, ...props}) => <h4 className="text-sm font-medium text-gray-200 mb-1" {...props} />,
                            h5: ({node, ...props}) => <h5 className="text-xs font-medium text-gray-200 mb-1" {...props} />,
                            h6: ({node, ...props}) => <h6 className="text-xs font-medium text-gray-300 mb-1" {...props} />,
                            
                            // Text formatting
                            p: ({node, ...props}) => <p className="text-gray-300 mb-2 leading-relaxed" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-gray-200" {...props} />,
                            b: ({node, ...props}) => <b className="font-semibold text-gray-200" {...props} />,
                            em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                            i: ({node, ...props}) => <i className="italic text-gray-300" {...props} />,
                            
                            // Code
                            code: ({node, ...props}) => {
                              // Check if this is inline code by looking at parent node
                              const isInline = node?.position?.start?.line === node?.position?.end?.line;
                              if (isInline) {
                                return <code className="bg-gray-800 text-gray-300 px-1 py-0.5 rounded text-sm" {...props} />;
                              }
                              return <code className="block bg-gray-800 text-gray-300 p-3 rounded-lg overflow-x-auto my-2" {...props} />;
                            },
                            pre: ({node, ...props}) => <pre className="bg-gray-800 text-gray-300 p-3 rounded-lg overflow-x-auto my-2" {...props} />,
                            
                            // Lists
                            ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-300 mb-2 space-y-1 ml-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside text-gray-300 mb-2 space-y-1 ml-2" {...props} />,
                            li: ({node, ...props}) => <li className="text-gray-300" {...props} />,
                            
                            // Other elements
                            blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-gray-700 pl-3 text-gray-400 italic my-2" {...props} />,
                            a: ({node, ...props}) => <a className="text-orange-400 hover:text-orange-300 underline" {...props} />,
                            hr: ({node, ...props}) => <hr className="border-0 border-t border-gray-700 my-3" {...props} />,
                            
                            // Tables (GFM support)
                            table: ({node, ...props}) => <table className="border-collapse border border-gray-600 my-2" {...props} />,
                            thead: ({node, ...props}) => <thead className="bg-gray-800" {...props} />,
                            tbody: ({node, ...props}) => <tbody {...props} />,
                            tr: ({node, ...props}) => <tr className="border-b border-gray-600" {...props} />,
                            th: ({node, ...props}) => <th className="border border-gray-600 px-2 py-1 text-gray-200 font-medium text-left" {...props} />,
                            td: ({node, ...props}) => <td className="border border-gray-600 px-2 py-1 text-gray-300" {...props} />,
                            
                            // Task lists (GFM support)
                            input: ({node, ...props}) => <input className="mr-2" {...props} />,
                            
                            // Line breaks
                            br: ({node, ...props}) => <br {...props} />,
                          }}
                        >
                          {message.content}
                        </SafeReactMarkdown>
                        <time className="text-xs opacity-50 mt-1 block text-gray-400">
                          {message.timestamp.toLocaleTimeString()}
                        </time>
                      </div>
                    )}
                  </div>

                  {/* MCQ Options for assistant messages */}
                  {message.role === "assistant" && message.mcqOptions && message.mcqOptions.length > 0 && (
                    <div className="flex justify-start mt-3">
                      <div className="max-w-[85%] space-y-2">
                        <p className="text-sm text-gray-400 mb-2">
                          {message.isMultiSelect ? "Select one or more options:" : "Select an option:"}
                        </p>
                        <div className="grid gap-2">
                          {message.mcqOptions.map((option, optionIndex) => {
                            const isSelected = selectedMcqOptions[message.id]?.includes(option) || false;
                            // MCQ is only interactive if this is the latest assistant message
                            const isLatestAssistantMessage = idx === messages.length - 1 || 
                              (idx === messages.length - 2 && messages[messages.length - 1].role === "user");
                            const isInteractive = isLatestAssistantMessage && !isLoading;
                            
                            return (
                              <button
                                key={optionIndex}
                                disabled={!isInteractive}
                                onClick={() => {
                                  if (!isInteractive) return;
                                  
                                  const currentSelections = selectedMcqOptions[message.id] || [];
                                  let newSelections: string[];
                                  
                                  if (message.isMultiSelect) {
                                    // Multi-select: toggle option
                                    if (isSelected) {
                                      newSelections = currentSelections.filter(s => s !== option);
                                    } else {
                                      newSelections = [...currentSelections, option];
                                    }
                                  } else {
                                    // Single-select: replace selection
                                    newSelections = isSelected ? [] : [option];
                                  }
                                  
                                  setSelectedMcqOptions(prev => ({
                                    ...prev,
                                    [message.id]: newSelections
                                  }));
                                  
                                  logTerminal(`MCQ selection [${message.id}]: ${newSelections.length > 0 ? newSelections.join(', ') : 'none'}`);
                                }}
                                className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                                  !isInteractive 
                                    ? isSelected
                                      ? "bg-orange-500/50 border-orange-500/50 text-white/70 cursor-not-allowed"
                                      : "bg-gray-800/50 border-gray-600/50 text-gray-400 cursor-not-allowed"
                                    : isSelected
                                      ? "bg-orange-500 border-orange-500 text-white"
                                      : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {message.isMultiSelect && (
                                    <div className={`w-3 h-3 rounded-full border flex-shrink-0 ${
                                      isSelected ? "bg-white border-white" : "border-gray-400"
                                    }`} />
                                  )}
                                  <div className="text-sm leading-relaxed flex-1">
                                    <SafeReactMarkdown
                                      
                                      components={{
                                        // Inline-optimized components for MCQ buttons
                                        p: ({node, ...props}) => <span className="text-current" {...props} />,
                                        strong: ({node, ...props}) => <strong className="font-semibold text-current" {...props} />,
                                        b: ({node, ...props}) => <b className="font-semibold text-current" {...props} />,
                                        em: ({node, ...props}) => <em className="italic text-current" {...props} />,
                                        i: ({node, ...props}) => <i className="italic text-current" {...props} />,
                                        code: ({node, ...props}) => <code className="bg-gray-700 text-current px-1 rounded text-xs" {...props} />,
                                        a: ({node, ...props}) => <a className="text-current underline" {...props} />,
                                        // Remove block elements that don't make sense in buttons
                                        h1: ({node, ...props}) => <span className="font-semibold text-current" {...props} />,
                                        h2: ({node, ...props}) => <span className="font-semibold text-current" {...props} />,
                                        h3: ({node, ...props}) => <span className="font-semibold text-current" {...props} />,
                                        ul: ({node, ...props}) => <span className="text-current" {...props} />,
                                        ol: ({node, ...props}) => <span className="text-current" {...props} />,
                                        li: ({node, ...props}) => <span className="text-current" {...props} />,
                                        blockquote: ({node, ...props}) => <span className="italic text-current" {...props} />,
                                        pre: ({node, ...props}) => <span className="font-mono text-current" {...props} />,
                                        br: ({node, ...props}) => <span className="text-current" {...props} />,
                                      }}
                                    >
                                      {option}
                                    </SafeReactMarkdown>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {lastError && (
              <ErrorMessage 
                error={lastError} 
                onRetry={() => setLastError(null)}
                className="mt-4" 
              />
            )}
            <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Fixed Input Area at bottom */}
          <div className="border-t border-gray-800 p-6 flex-shrink-0">
            <form onSubmit={handleSubmit}>
              {/* Show uploaded files above textarea exactly like index page */}
              {uploadedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {uploadedFiles.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-full px-3 py-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-300" />
                      <span className="max-w-[220px] truncate text-white">{f.name}</span>
                      <span className="text-xs text-gray-400">{f.type?.split('/').pop()?.toUpperCase() || ''}</span>
                      <button onClick={() => removeFile(f.id)} className="text-gray-400 hover:text-red-400 ml-2">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your automation requirements..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-24 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                  rows={3}
                />
                {/* File upload input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.csv,.json,.xml,.plc,.l5x"
                />
                {/* Attachment button - exact same positioning as index page */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                {/* Send button - exact same positioning as index page */}
                <button
                  type="submit"
                  disabled={((): boolean => {
                    // Allow MCQ-only submissions on mobile (window width < 1024)
                    try {
                      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
                      const hasMcqSelection = !Object.values(selectedMcqOptions).every(options => !options || options.length === 0);
                      // If not mobile, require either text or MCQ selection. On mobile, allow submit when MCQ selections exist even if input is empty.
                      if (isMobile) {
                        return !(input.trim() || hasMcqSelection) || isLoading;
                      }
                      return (!input.trim() && !hasMcqSelection) || isLoading;
                    } catch {
                      return (!input.trim() && Object.values(selectedMcqOptions).every(options => !options || options.length === 0)) || isLoading;
                    }
                  })()}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* Resize Handle for Desktop */}
        <div 
          className="hidden lg:block w-1 bg-gray-700 hover:bg-gray-500 cursor-col-resize transition-colors relative group"
          onMouseDown={handleMouseDown}
          title="Drag to resize"
        >
          <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-gray-600 group-hover:bg-gray-400" />
        </div>

        {/* Mobile + Desktop: Tabbed Output Area */}
        <div className="flex-1 flex flex-col bg-gray-950 min-h-0">
          {/* Output Tabs - Including Chat tab for mobile - STICKY */}
          <div className="border-b border-gray-800 px-6 py-3 flex-shrink-0 sticky top-0 bg-gray-950 z-20 min-h-[60px] flex items-center">
            <div className="flex gap-1 overflow-x-auto w-full">
              {/* Chat tab - only visible on mobile */}
              <button
                onClick={() => setActiveView("chat" as OutputView)}
                className={`lg:hidden group relative p-2 rounded-lg transition-colors flex-shrink-0 ${
                  activeView === "chat" 
                    ? "bg-orange-500 text-white" 
                    : "hover:bg-gray-800 text-gray-400"
                }`}
                title="Chat"
              >
                <MessageSquare className="w-5 h-5" />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                  Chat
                </div>
              </button>
              
              {/* WIP tabs - Left side */}
              {wipViews.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`group relative p-2 rounded-lg transition-colors flex-shrink-0 ${
                    activeView === view.id 
                      ? "bg-orange-500 text-white" 
                      : "hover:bg-gray-800 text-gray-400"
                  }`}
                  title={view.name}
                >
                  <view.icon className="w-5 h-5" />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                    {view.name}
                  </div>
                </button>
              ))}
              
              {/* Separator */}
              <div className="mx-2 w-px bg-gray-700 flex-shrink-0"></div>
              
              {/* Result tabs - Right side */}
              {resultViews.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`group relative p-2 rounded-lg transition-colors flex-shrink-0 ${
                    activeView === view.id 
                      ? "bg-orange-500 text-white" 
                      : "hover:bg-gray-800 text-gray-400"
                  }`}
                  title={view.name}
                >
                  <view.icon className="w-5 h-5" />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                    {view.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* (StageIndicator moved into Chat header for mobile) */}

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-hidden min-h-0">
            {activeView === "chat" ? (
              /* Chat view for mobile - Full height with fixed input */
              <div className="h-full flex flex-col lg:hidden">
                {/* Mobile Chat Header - Stage indicator */}
                <div className="px-6 py-2 border-b border-gray-800 w-full">
                  {/* Responsive row: stack on mobile, attempt inline on larger screens and wrap if needed */}
                  <div className="flex flex-col lg:flex-row lg:flex-nowrap flex-wrap items-start lg:items-center justify-start gap-2 pl-2 lg:pl-0">
                    <div className="flex items-start justify-start">
                      <StageIndicator currentStage={currentStage} nextStage={nextStage} confidence={stageProgress?.confidence} />
                    </div>

                    <div className="flex items-start justify-start">
                      <Button
                        size="sm"
                        onClick={handleGenerateClick}
                        disabled={isLoading || apiCallInProgress}
                        className="border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white text-xs px-2 py-1 bg-transparent disabled:opacity-50"
                      >
                        <SkipForward className="w-3 h-3 mr-1 text-gray-400" />
                        <span className="align-middle">Skip to Code</span>
                      </Button>
                    </div>
                  </div>

                  {generateWarning && (
                    <div className="mt-2 text-xs text-yellow-300 text-left lg:text-center w-full px-2">{generateWarning}</div>
                  )}
                </div>
                {/* Messages - Scrollable area */}
                  <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0 relative">
                    {/* Files are now shown above individual messages */}
                  <div className="space-y-4 max-w-none pb-4">
                    {messages.map((message, idx) => {
                      return (
                      <div key={message.id}>
                        {/* File indicators matching index page style - smaller version */}
                        {message.role === "user" && message.hasFiles && (
                          <div className="flex justify-end mb-2">
                            <div className="flex flex-wrap gap-2 justify-end">
                              {(message.attachedFiles || uploadedFiles || []).map((file, fileIdx) => (
                                <div key={fileIdx} className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-2 py-1 text-xs hover:bg-gray-800 transition-all duration-150 group">
                                  <FileText className="w-3 h-3 text-gray-300 group-hover:text-gray-100 transition-colors duration-150" />
                                  <span className="text-gray-300 font-medium group-hover:text-gray-100 transition-colors duration-150">
                                    {file?.name?.slice(0, 5).toUpperCase() || 'FILE'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                          {message.role === "user" ? (
                            <div className="max-w-[85%] rounded-lg px-4 py-3 bg-orange-500 text-white">
                              <p className="whitespace-pre-wrap">{message.content}</p>
                              <time className="text-xs opacity-70 mt-1 block">
                                {message.timestamp.toLocaleTimeString()}
                              </time>
                            </div>
                          ) : (
                            <div className="max-w-[85%] text-gray-100">
                              <SafeReactMarkdown
                                
                                components={{
                                  // Headers
                                  h1: ({node, ...props}) => <h1 className="text-lg font-semibold text-gray-200 mb-2" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-base font-semibold text-gray-200 mb-2" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-gray-200 mb-1" {...props} />,
                                  h4: ({node, ...props}) => <h4 className="text-sm font-medium text-gray-200 mb-1" {...props} />,
                                  h5: ({node, ...props}) => <h5 className="text-xs font-medium text-gray-200 mb-1" {...props} />,
                                  h6: ({node, ...props}) => <h6 className="text-xs font-medium text-gray-300 mb-1" {...props} />,
                                  
                                  // Text formatting
                                  p: ({node, ...props}) => <p className="text-gray-300 mb-2 leading-relaxed" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-semibold text-gray-200" {...props} />,
                                  b: ({node, ...props}) => <b className="font-semibold text-gray-200" {...props} />,
                                  em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                                  i: ({node, ...props}) => <i className="italic text-gray-300" {...props} />,
                                  
                                  // Code
                                  code: ({node, ...props}) => {
                                    // Check if this is inline code by looking at parent node
                                    const isInline = node?.position?.start?.line === node?.position?.end?.line;
                                    if (isInline) {
                                      return <code className="bg-gray-800 text-gray-300 px-1 py-0.5 rounded text-sm" {...props} />;
                                    }
                                    return <code className="block bg-gray-800 text-gray-300 p-3 rounded-lg overflow-x-auto my-2" {...props} />;
                                  },
                                  pre: ({node, ...props}) => <pre className="bg-gray-800 text-gray-300 p-3 rounded-lg overflow-x-auto my-2" {...props} />,
                                  
                                  // Lists
                                  ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-300 mb-2 space-y-1 ml-2" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal list-inside text-gray-300 mb-2 space-y-1 ml-2" {...props} />,
                                  li: ({node, ...props}) => <li className="text-gray-300" {...props} />,
                                  
                                  // Other elements
                                  blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-gray-700 pl-3 text-gray-400 italic my-2" {...props} />,
                                  a: ({node, ...props}) => <a className="text-orange-400 hover:text-orange-300 underline" {...props} />,
                                  hr: ({node, ...props}) => <hr className="border-0 border-t border-gray-700 my-3" {...props} />,
                                  
                                  // Tables (GFM support)
                                  table: ({node, ...props}) => <table className="border-collapse border border-gray-600 my-2" {...props} />,
                                  thead: ({node, ...props}) => <thead className="bg-gray-800" {...props} />,
                                  tbody: ({node, ...props}) => <tbody {...props} />,
                                  tr: ({node, ...props}) => <tr className="border-b border-gray-600" {...props} />,
                                  th: ({node, ...props}) => <th className="border border-gray-600 px-2 py-1 text-gray-200 font-medium text-left" {...props} />,
                                  td: ({node, ...props}) => <td className="border border-gray-600 px-2 py-1 text-gray-300" {...props} />,
                                  
                                  // Task lists (GFM support)
                                  input: ({node, ...props}) => <input className="mr-2" {...props} />,
                                  
                                  // Line breaks
                                  br: ({node, ...props}) => <br {...props} />,
                                }}
                              >
                                {message.content}
                              </SafeReactMarkdown>
                              <time className="text-xs opacity-50 mt-1 block text-gray-400">
                                {message.timestamp.toLocaleTimeString()}
                              </time>
                            </div>
                          )}
                        </div>

                        {/* MCQ Options for assistant messages */}
                        {message.role === "assistant" && message.mcqOptions && message.mcqOptions.length > 0 && (
                          <div className="flex justify-start mt-3">
                            <div className="max-w-[85%] space-y-2">
                              <p className="text-sm text-gray-400 mb-2">
                                {message.isMultiSelect ? "Select one or more options:" : "Select an option:"}
                              </p>
                              <div className="grid gap-2">
                                {message.mcqOptions.map((option, optionIndex) => {
                                  const isSelected = selectedMcqOptions[message.id]?.includes(option) || false;
                                  // MCQ is only interactive if this is the latest assistant message
                                  const isLatestAssistantMessage = idx === messages.length - 1 || 
                                    (idx === messages.length - 2 && messages[messages.length - 1].role === "user");
                                  const isInteractive = isLatestAssistantMessage && !isLoading;
                                  
                                  return (
                                    <button
                                      key={optionIndex}
                                      disabled={!isInteractive}
                                      onClick={() => {
                                        if (!isInteractive) return;
                                        
                                        const currentSelections = selectedMcqOptions[message.id] || [];
                                        let newSelections: string[];
                                        
                                        if (message.isMultiSelect) {
                                          // Multi-select: toggle option
                                          if (isSelected) {
                                            newSelections = currentSelections.filter(s => s !== option);
                                          } else {
                                            newSelections = [...currentSelections, option];
                                          }
                                        } else {
                                          // Single-select: replace selection
                                          newSelections = isSelected ? [] : [option];
                                        }
                                        
                                        setSelectedMcqOptions(prev => ({
                                          ...prev,
                                          [message.id]: newSelections
                                        }));
                                        
                                        logTerminal(`MCQ selection [${message.id}]: ${newSelections.length > 0 ? newSelections.join(', ') : 'none'}`);
                                      }}
                                      className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                                        !isInteractive 
                                          ? isSelected
                                            ? "bg-orange-500/50 border-orange-500/50 text-white/70 cursor-not-allowed"
                                            : "bg-gray-800/50 border-gray-600/50 text-gray-400 cursor-not-allowed"
                                          : isSelected
                                            ? "bg-orange-500 border-orange-500 text-white"
                                            : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {message.isMultiSelect && (
                                          <div className={`w-3 h-3 rounded-full border flex-shrink-0 ${
                                            isSelected ? "bg-white border-white" : "border-gray-400"
                                          }`} />
                                        )}
                                        <div className="text-sm leading-relaxed flex-1">
                                          <SafeReactMarkdown
                                            
                                            components={{
                                              // Inline-optimized components for MCQ buttons
                                              p: ({node, ...props}) => <span className="text-current" {...props} />,
                                              strong: ({node, ...props}) => <strong className="font-semibold text-current" {...props} />,
                                              b: ({node, ...props}) => <b className="font-semibold text-current" {...props} />,
                                              em: ({node, ...props}) => <em className="italic text-current" {...props} />,
                                              i: ({node, ...props}) => <i className="italic text-current" {...props} />,
                                              code: ({node, ...props}) => <code className="bg-gray-700 text-current px-1 rounded text-xs" {...props} />,
                                              a: ({node, ...props}) => <a className="text-current underline" {...props} />,
                                              // Remove block elements that don't make sense in buttons
                                              h1: ({node, ...props}) => <span className="font-semibold text-current" {...props} />,
                                              h2: ({node, ...props}) => <span className="font-semibold text-current" {...props} />,
                                              h3: ({node, ...props}) => <span className="font-semibold text-current" {...props} />,
                                              ul: ({node, ...props}) => <span className="text-current" {...props} />,
                                              ol: ({node, ...props}) => <span className="text-current" {...props} />,
                                              li: ({node, ...props}) => <span className="text-current" {...props} />,
                                              blockquote: ({node, ...props}) => <span className="italic text-current" {...props} />,
                                              pre: ({node, ...props}) => <span className="font-mono text-current" {...props} />,
                                              br: ({node, ...props}) => <span className="text-current" {...props} />,
                                            }}
                                          >
                                            {option}
                                          </SafeReactMarkdown>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      );
                    })}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {lastError && (
                    <ErrorMessage 
                      error={lastError} 
                      onRetry={() => setLastError(null)}
                      className="mx-4 mb-2" 
                    />
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Fixed Input Area at bottom */}
                <div className="border-t border-gray-800 p-4 flex-shrink-0 bg-gray-950">
                  <form onSubmit={handleSubmit}>
                    {/* Show uploaded files above textarea on mobile too */}
                    {!selectedFileId && uploadedFiles.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {uploadedFiles.map((f) => (
                          <div key={f.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-full px-3 py-2 text-sm">
                            <FileText className="w-4 h-4 text-gray-300" />
                            <span className="max-w-[220px] truncate text-white">{f.name}</span>
                            <span className="text-xs text-gray-400">{f.type?.split('/').pop()?.toUpperCase() || ''}</span>
                            <button onClick={() => removeFile(f.id)} className="text-gray-400 hover:text-red-400 ml-2">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* If a file is selected show filename header */}
                    {selectedFileId && (
                      <div className="mb-2 flex items-center justify-between bg-gray-900 border border-gray-800 rounded-t-lg px-3 py-2">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-gray-300" />
                          <input
                            className="bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                            value={uploadedFiles.find(f => f.id === selectedFileId)?.name || ''}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setUploadedFiles(prev => prev.map(f => f.id === selectedFileId ? { ...f, name: newName } : f));
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedFileId(null)}
                            className="text-gray-400 hover:text-white text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFile(selectedFileId)}
                            className="text-red-400 hover:text-red-500 text-sm"
                            title="Remove file"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <textarea
                        value={selectedFileId ? (uploadedFiles.find(f => f.id === selectedFileId)?.content ?? input) : input}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (selectedFileId) {
                            setUploadedFiles(prev => prev.map(f => f.id === selectedFileId ? { ...f, content: val } : f));
                          } else {
                            setInput(val);
                          }
                        }}
                        onKeyDown={handleKeyDownMobile}
                        placeholder={selectedFileId ? "Edit file content..." : "Your thoughts..."}
                        className={`w-full bg-gray-800 border border-gray-700 ${selectedFileId ? 'rounded-b-lg rounded-t-none' : 'rounded-lg'} px-4 py-3 ${selectedFileId ? 'pr-12' : 'pr-24'} resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400`}
                        rows={selectedFileId ? 8 : 2}
                      />
                      {/* File upload button - only show when not editing a file, match index page positioning */}
                      {!selectedFileId && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute right-12 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-orange-500 transition-colors"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                      )}
                      {/* Send button - match index page positioning */}
                      <button
                        type="submit"
                        disabled={((): boolean => {
                          try {
                            const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
                            const hasMcqSelection = !Object.values(selectedMcqOptions).every(options => !options || options.length === 0);

                            // If editing a file, require file content unless mobile and MCQ selections exist
                            if (selectedFileId) {
                              const fileContent = (uploadedFiles.find(f => f.id === selectedFileId)?.content ?? '').trim();
                              if (isMobile) return !(fileContent || hasMcqSelection) || isLoading;
                              return !fileContent || isLoading;
                            }

                            // Not editing a file: consider input or MCQ selections
                            if (isMobile) return !(input.trim() || hasMcqSelection) || isLoading;
                            return !input.trim() || isLoading;
                          } catch {
                            return !(selectedFileId ? (uploadedFiles.find(f => f.id === selectedFileId)?.content ?? '').trim() : input.trim()) || isLoading;
                          }
                        })()}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              /* Output views - Full height container */
              <div className="flex-1 min-h-0">
                {renderOutputContent()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}