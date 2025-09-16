import { useState, useRef, useEffect, createElement } from "react";
import { useParams, Link, useSearchParams } from "@remix-run/react";
import { 
  Send, 
  MessageSquare, 
  FileText, 
  GitBranch, 
  List, 
  Network, 
  Box,
  Terminal,
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
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string | null;
}

type OutputView = "chat" | "structured-text" | "function-block" | "sequential-chart" | "signal-mapping" | "digital-twin" | "terminal";

const outputViews = [
  { id: "structured-text" as OutputView, icon: FileText, name: "Structured Text", shortName: "ST", description: "IEC 61131-3 Structured Text programming language" },
  { id: "function-block" as OutputView, icon: GitBranch, name: "Function Block Diagram", shortName: "FBD", description: "Graphical programming with function blocks" },
  { id: "sequential-chart" as OutputView, icon: List, name: "Sequential Function Chart", shortName: "SFC", description: "Sequential control flow programming" },
  { id: "signal-mapping" as OutputView, icon: Network, name: "Signal Mapping", shortName: "MAP", description: "Input/output signal assignments" },
  { id: "digital-twin" as OutputView, icon: Box, name: "Digital Twin", shortName: "DT", description: "3D visualization and simulation" }
  ,{ id: "terminal" as OutputView, icon: Terminal, name: "Terminal", shortName: "T", description: "Copilot logs, errors, warnings" }
];

export default function PLCCopilotProject() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<OutputView>(() => {
    // Default to chat on mobile, structured-text on desktop
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return "chat";
    }
    return "structured-text";
  });
  const [initialApiCall, setInitialApiCall] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [apiCallInProgress, setApiCallInProgress] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

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
  logTerminal(`SEND LLM [${currentStage}] -> ${buildPromptModifier(currentStage)} model=gpt-4o-mini prompt=${userMessage.content.slice(0, 80).replace(/\n/g, ' ')}${userMessage.content.length > 80 ? '…' : ''}`);
      // Call the real API - works for both initial and follow-up messages
      const response: ChatResponse = await apiClient.chat({
        user_prompt: `Context: You are PLC Copilot, an expert assistant for industrial automation and PLC programming. User request: ${userMessage.content}`,
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_completion_tokens: 1024
      });

      // Log brief response summary
      logTerminal(`RECV LLM <- length=${response.content.length}`);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: "assistant",
        timestamp: new Date()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
      hasFiles: uploadedFiles.length > 0, // Track if this message had files
      attachedFiles: uploadedFiles.map(f => ({ name: f.name, type: f.type }))
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setUploadedFiles([]); // Clear uploaded files immediately when message is sent
    localStorage.removeItem('plc_copilot_uploaded_files'); // Clear from localStorage too
    setIsLoading(true);
    setApiCallInProgress(true);
    setLastError(null);

    try {
      // Log outgoing LLM request for submitted input
  logTerminal(`SEND LLM [${currentStage}] -> ${buildPromptModifier(currentStage)} model=gpt-4o-mini prompt=${userMessage.content.slice(0, 80).replace(/\n/g, ' ')}${userMessage.content.length > 80 ? '…' : ''}`);
      // Call the real API - works for both initial and follow-up messages
      const response: ChatResponse = await apiClient.chat({
        user_prompt: `Context: You are PLC Copilot, an expert assistant for industrial automation and PLC programming. User request: ${userMessage.content}`,
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_completion_tokens: 1024
      });

      logTerminal(`RECV LLM <- length=${response.content.length}`);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: "assistant",
        timestamp: new Date()
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
    // Here you could add API calls to update the backend stage
    console.log(`Stage transition: ${currentStage} -> ${newStage}`, reason);
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
            <div className="font-mono text-sm bg-gray-900 rounded-lg flex flex-col min-h-0 flex-1">
              <div className="flex-1 overflow-y-auto p-6">
                <pre className="text-gray-200 whitespace-pre-wrap">
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
      case "terminal":
        return (
          <div className="h-full p-6 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-orange-500" />
                <h2 className="text-sm font-semibold">Copilot Terminal</h2>
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

            <div className="flex-1 bg-black bg-opacity-60 rounded-lg border border-gray-800 font-mono text-sm overflow-y-auto p-4">
              {terminalLogs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Errors and warnings will appear here.</div>
              ) : (
                <pre className="text-gray-200 whitespace-pre-wrap">{terminalLogs.join('\n')}</pre>
              )}
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
                    onClick={() => handleStageTransition('code_generation', 'User requested to skip to code generation')}
                    className="border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white text-xs px-2 py-1 ml-3 bg-transparent"
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
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-orange-500 text-white"
                          : "bg-gray-800 text-gray-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <time className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </time>
                    </div>
                  </div>
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
                  disabled={!input.trim() || isLoading}
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
              
              {outputViews.map((view) => (
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
                          <div
                            className={`max-w-[85%] rounded-lg px-4 py-3 ${
                              message.role === "user"
                                ? "bg-orange-500 text-white"
                                : "bg-gray-800 text-gray-100"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <time className="text-xs opacity-70 mt-1 block">
                              {message.timestamp.toLocaleTimeString()}
                            </time>
                          </div>
                        </div>
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