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
  ArrowLeft 
} from "lucide-react";
import { apiClient, type ChatResponse } from "~/lib/api-client";
import { ConnectionStatus, ErrorMessage } from "~/components/ConnectionStatus";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

type OutputView = "structured-text" | "function-block" | "sequential-chart" | "signal-mapping" | "digital-twin";

const outputViews = [
  { id: "structured-text" as OutputView, icon: FileText, name: "Structured Text", shortName: "ST" },
  { id: "function-block" as OutputView, icon: GitBranch, name: "Function Block Diagram", shortName: "FBD" },
  { id: "sequential-chart" as OutputView, icon: List, name: "Sequential Function Chart", shortName: "SFC" },
  { id: "signal-mapping" as OutputView, icon: Network, name: "Signal Mapping", shortName: "MAP" },
  { id: "digital-twin" as OutputView, icon: Box, name: "Digital Twin", shortName: "DT" }
];

export default function PLCCopilotProject() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const msgs: Message[] = [];
    if (initialPrompt) {
      msgs.push({
        id: "1",
        content: initialPrompt,
        role: "user",
        timestamp: new Date(Date.now() - 2000)
      });
    }
    return msgs;
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<OutputView>("structured-text");
  const [initialApiCall, setInitialApiCall] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle initial API call when component mounts with a prompt
  useEffect(() => {
    if (initialPrompt && !initialApiCall) {
      setInitialApiCall(true);
      setIsLoading(true);
      
      apiClient.chat({
        user_prompt: `Context: You are PLC Copilot, an expert assistant for industrial automation and PLC programming. The user just asked: "${initialPrompt}". Please provide a helpful, detailed response about their PLC programming question or request.`,
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_completion_tokens: 1024
      }).then(response => {
        const assistantMessage: Message = {
          id: "2",
          content: response.content,
          role: "assistant",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }).catch(error => {
        console.error('Initial API call failed:', error);
        const fallbackMessage: Message = {
          id: "2",
          content: "I'll help you create that PLC solution. Let me analyze your requirements and generate the appropriate code. This structured text implementation will include all necessary safety interlocks and control logic.",
          role: "assistant",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [initialPrompt, initialApiCall]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setLastError(null);

    try {
      // Call the real API
      const response: ChatResponse = await apiClient.chat({
        user_prompt: `Context: You are PLC Copilot, an expert assistant for industrial automation and PLC programming. User request: ${userMessage.content}`,
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_completion_tokens: 1024
      });

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
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderOutputContent = () => {
    switch (activeView) {
      case "structured-text":
        return (
          <div className="font-mono text-sm bg-gray-900 p-6 rounded-lg h-full overflow-auto">
            <pre className="text-green-400 whitespace-pre-wrap">
{`// Conveyor Belt Control System
// Generated by Xelerit PLC Copilot

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
              <p className="text-sm">Coming soon in the next release</p>
              <p className="text-xs mt-2 opacity-70">This view will show the {activeView.replace('-', ' ')} representation</p>
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

      {/* Main Content Area - Full Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Column - Exactly 25% width */}
        <div className="w-1/4 bg-gray-950 border-r border-gray-800 flex flex-col">
          {/* Messages - Take available space above input */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-4 max-w-none pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
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
              ))}
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

          {/* Input Area - Fixed at bottom */}
          <div className="border-t border-gray-800 p-4 flex-shrink-0 bg-gray-950">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Your thoughts..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-1.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Output Area - Exactly 75% width */}
        <div className="flex-1 hidden md:flex flex-col bg-gray-950">
          {/* Output Tabs */}
          <div className="border-b border-gray-800 px-6 py-3 flex-shrink-0">
            <div className="flex gap-1">
              {outputViews.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`group relative p-2 rounded-lg transition-colors ${
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

          {/* Output Content - Fills remaining space */}
          <div className="flex-1 p-6 overflow-auto">
            {renderOutputContent()}
          </div>
        </div>

        {/* Mobile: Full-width chat only */}
        <div className="md:hidden absolute inset-0 bg-gray-950 flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-4 max-w-none pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
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
              ))}
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
          </div>

          <div className="border-t border-gray-800 p-4 flex-shrink-0 bg-gray-950">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Your thoughts..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-1.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}