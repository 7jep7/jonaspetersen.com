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
import { apiClient, type ChatResponse } from "~/lib/api-client";
import { ConnectionStatus, ErrorMessage } from "~/components/ConnectionStatus";
import { StageIndicator } from "~/components/StageIndicator";
import { Button } from "~/components/ui/button";

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

interface DeviceConstant {
  id: string;
  path: string[];  // e.g., ["Device", "Vendor"] for hierarchical display
  name: string;
  value: string;
  source?: string; // e.g., "datasheet", "conversation", "manual"
}

interface ProjectContext {
  deviceConstants: DeviceConstant[];
  information: string; // Markdown text with notes and bullet points
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
  const [activeView, setActiveView] = useState<OutputView>(() => {
    // Default to chat on mobile, structured-text on desktop
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return "chat";
    }
    return "structured-text";
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

    setProjectContext(prev => ({
      ...prev,
      deviceConstants: [...prev.deviceConstants, newConst]
    }));

    logTerminal(`Added device constant: ${pathParts.join('.')}.${actualName} = ${value}`);

    // Reset Name/Value inputs (keep path)
    setNewConstantName('');
    setNewConstantValue('');
  };
  const [initialApiCall, setInitialApiCall] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [apiCallInProgress, setApiCallInProgress] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  // Context state
  const [projectContext, setProjectContext] = useState<ProjectContext>({
    deviceConstants: [
      // Sample data for testing
      {
        id: "1",
        path: ["Device"],
        name: "Model",
        value: "VS-C1500CX",
        source: "datasheet"
      },
      {
        id: "2", 
        path: ["Device"],
        name: "Vendor",
        value: "KEYENCE",
        source: "datasheet"
      },
      {
        id: "3",
        path: ["Device"],
        name: "Class", 
        value: "Camera",
        source: "datasheet"
      },
      {
        id: "4",
        path: ["Interface"],
        name: "Type",
        value: "Ethernet/IP",
        source: "conversation"
      },
      {
        id: "5",
        path: ["Interface"],
        name: "Role",
        value: "peripheral",
        source: "conversation"
      }
    ],
    information: `# Project Overview
This automation project involves setting up a vision inspection system using KEYENCE cameras.

## Key Requirements
- Vision inspection for quality control
- Integration with existing PLC system
- Real-time data transmission
- Error handling and alerts

## Notes from Conversation
- Customer prefers Ethernet/IP communication
- System needs to handle 100 parts per minute
- Integration with existing SCADA system required
- Safety interlocks must be maintained`
  });

  // Local editable information input (starts empty)
  const [informationInput, setInformationInput] = useState<string>("");

  // Collapsed state for hierarchy nodes (keyed by dot-path like 'Device' or 'Device.Interface')
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (path: string) => {
    setCollapsedNodes(prev => ({ ...prev, [path]: !prev[path] }));
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
          if (/^([A-Z]\)|\d\.|-|•)\s*/.test(candidate)) {
            optionLines.push(candidate.replace(/^([A-Z]\)|\d\.|-|•)\s*/, '').trim());
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
  
  // Conversation stage management
  const [currentStage, setCurrentStage] = useState<'project_kickoff' | 'gather_requirements' | 'code_generation' | 'refinement_testing' | 'completed'>('gather_requirements');
  const [nextStage, setNextStage] = useState<'project_kickoff' | 'gather_requirements' | 'code_generation' | 'refinement_testing' | 'completed' | undefined>();
  const [stageProgress, setStageProgress] = useState<{ confidence?: number }>({});

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
    logApiSummary('SEND', userMessage.content);
      // Call the real API - works for both initial and follow-up messages
      const response: ChatResponse = await apiClient.chat({
        user_prompt: `Context: You are PLC Copilot, an expert assistant for industrial automation and PLC programming. User request: ${userMessage.content}`,
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_completion_tokens: 1024
      });

  // Log brief response summary
  logApiSummary('RECV', response.content);
      
      // Check if response contains MCQ and extract options
      const mcqOptions = parseMCQ(response.content);
      if (mcqOptions && mcqOptions.length > 0) {
        logTerminal(`MCQ detected: ${mcqOptions.length} options [${mcqOptions.map(opt => opt.slice(0, 30)).join(', ')}${mcqOptions.some(opt => opt.length > 30) ? '...' : ''}]`);
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: "assistant",
        timestamp: new Date(),
        mcqOptions: mcqOptions || undefined,
        isMultiSelect: mcqOptions ? mcqOptions.length > 2 : undefined // Assume multi-select if >2 options
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

  // Compact API summary logger used to produce a single-line send/receive entry
  const logApiSummary = (direction: 'SEND' | 'RECV', contentSnippet: string) => {
    const ts = new Date().toLocaleTimeString();
    const short = contentSnippet.replace(/\s+/g, ' ').trim().slice(0, 80);
    logTerminal(`${direction} ${ts} ${short}${contentSnippet.length > 80 ? '…' : ''}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Collect all currently selected MCQ options
    const allSelectedOptions: string[] = [];
    const mcqSelectionMessages: string[] = [];
    
    Object.keys(selectedMcqOptions).forEach(messageId => {
      const selections = selectedMcqOptions[messageId];
      if (selections && selections.length > 0) {
        allSelectedOptions.push(...selections);
        mcqSelectionMessages.push(`Selected options: ${selections.join(', ')}`);
      }
    });
    
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
        // Construct prompt with MCQ selections as context (strip markdown before sending)
        const stripped = allSelectedOptions.map(o => stripMarkdown(o));
        const mcqBlock = `MCQ_SELECTIONS: ${stripped.join(' ||| ')}`; // explicit delimiter for backend parsing
        const mcqContext = `User selected the following options: ${stripped.join(', ')}`;

        logApiSummary('SEND', `${mcqBlock} ${mcqContext}`);

        const response: ChatResponse = await apiClient.chat({
          user_prompt: `Context: You are PLC Copilot, an expert assistant for industrial automation and PLC programming. ${mcqContext}. ${mcqBlock}. Continue the conversation based on these selections.`,
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_completion_tokens: 1024
        });

        logApiSummary('RECV', response.content);
        
        // Check if response contains MCQ and extract options
        const mcqOptions = parseMCQ(response.content);
        if (mcqOptions && mcqOptions.length > 0) {
          logTerminal(`MCQ detected: ${mcqOptions.length} options [${mcqOptions.map(opt => opt.slice(0, 30)).join(', ')}${mcqOptions.some(opt => opt.length > 30) ? '...' : ''}]`);
        }
        
        const assistantMessage: Message = {
          id: Date.now().toString(),
          content: response.content,
          role: "assistant",
          timestamp: new Date(),
          mcqOptions: mcqOptions || undefined,
          isMultiSelect: mcqOptions ? mcqOptions.length > 2 : undefined
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
      // Prepare MCQ context text (sent to backend only)
      const stripped = allSelectedOptions.length > 0 ? allSelectedOptions.map(o => stripMarkdown(o)) : [];
      const mcqBlock = stripped.length > 0 ? `MCQ_SELECTIONS: ${stripped.join(' ||| ')}` : '';
      const mcqContext = stripped.length > 0 ? `User selected the following options: ${stripped.join(', ')}` : '';

      // Log outgoing LLM request for submitted input (compact)
      logApiSummary('SEND', `${mcqBlock} ${visibleContent}`);

      // Call the real API - include MCQ selections in the user_prompt but don't display them in the UI
      const response: ChatResponse = await apiClient.chat({
        user_prompt: `Context: You are PLC Copilot, an expert assistant for industrial automation and PLC programming. ${mcqContext} ${mcqBlock} User request: ${visibleContent}`,
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_completion_tokens: 1024
      });
      logApiSummary('RECV', response.content);

      // Check if response contains MCQ and extract options
      const mcqOptions = parseMCQ(response.content);
      if (mcqOptions && mcqOptions.length > 0) {
        logTerminal(`MCQ detected: ${mcqOptions.length} options [${mcqOptions.map(opt => opt.slice(0, 30)).join(', ')}${mcqOptions.some(opt => opt.length > 30) ? '...' : ''}]`);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: "assistant",
        timestamp: new Date(),
        mcqOptions: mcqOptions || undefined,
        isMultiSelect: mcqOptions ? mcqOptions.length > 2 : undefined
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
{`// Conveyor Belt Control System
// Generated by PLC Copilot

PROGRAM ConveyorControl
VAR
    bStart          : BOOL := FALSE;      // Start button
    bStop           : BOOL := FALSE;      // Stop button  
    bEmergencyStop  : BOOL := FALSE;      // E-stop
    bMotorRunning   : BOOL := FALSE;      // Motor status
    bSafetyOK       : BOOL := TRUE;       // Safety check
    tMotorTimer     : TON;                // Motor timer
    
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

            <div className="flex-1 flex gap-4 min-h-0">
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
                  <div className="text-xs text-gray-500 mt-1">Use dot notation in name field for hierarchy, e.g. <span className="font-mono">Device.Interface.Type</span></div>

                  {projectContext.deviceConstants.length === 0 ? (
                    <div className="text-gray-500 text-sm">No device constants gathered yet. Information will be extracted from datasheets and conversations.</div>
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
                              elements.push(
                                <div key={constant.id} className={`py-1 px-2 rounded text-sm bg-transparent hover:bg-gray-800/40 transition-colors ${level > 0 ? 'ml-4' : ''}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-300 font-mono">{constant.name}</span>
                                    <span className="text-gray-400 font-mono">:</span>
                                    <span className="text-gray-400 font-mono">{constant.value}</span>
                                  </div>
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
              <div className="flex-1 min-h-0">
                <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Information
                </h3>
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 overflow-y-auto h-full">
                  <textarea
                    value={informationInput}
                    onChange={(e) => setInformationInput(e.target.value)}
                    placeholder="Add notes or project info..."
                    className="w-full h-full min-h-[200px] bg-transparent resize-none outline-none placeholder-gray-500 text-gray-200 text-sm"
                  />
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
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
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
                        </ReactMarkdown>
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
                                    <ReactMarkdown 
                                      remarkPlugins={[remarkGfm]}
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
                                    </ReactMarkdown>
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
                  disabled={(!input.trim() && Object.values(selectedMcqOptions).every(options => !options || options.length === 0)) || isLoading}
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

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-hidden min-h-0">
            {activeView === "chat" ? (
              /* Chat view for mobile - Full height with fixed input */
              <div className="h-full flex flex-col lg:hidden">
                {/* Messages - Scrollable area */}
                  <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0 relative">
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
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
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
                              </ReactMarkdown>
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
                                          <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
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
                                          </ReactMarkdown>
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
                        disabled={!(selectedFileId ? (uploadedFiles.find(f => f.id === selectedFileId)?.content ?? '').trim() : input.trim()) || isLoading}
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