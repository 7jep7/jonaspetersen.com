import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@remix-run/react";
import { Send, Plus, Settings, MessageSquare, Paperclip, X, FileText } from "lucide-react";
import { ConnectionStatus } from "~/components/ConnectionStatus";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string | null;
}

export default function PLCCopilotIndex() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load persisted files from localStorage (if any)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('plc_copilot_uploaded_files');
      console.log('Index page: Loading files from localStorage:', raw);
      if (raw) {
        const files = JSON.parse(raw);
        console.log('Index page: Parsed files:', files);
        setUploadedFiles(files);
      }
    } catch (e) {
      console.error('Index page: Failed to load files from localStorage:', e);
    }
  }, []);

  // Persist uploadedFiles to localStorage
  useEffect(() => {
    try {
      console.log('Index page: Saving files to localStorage:', uploadedFiles);
      localStorage.setItem('plc_copilot_uploaded_files', JSON.stringify(uploadedFiles));
    } catch (e) {
      console.error('Index page: Failed to save files to localStorage:', e);
    }
  }, [uploadedFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Generate session ID
    const sessionId = Date.now().toString();
    
    // Check if we're on mobile (no animation)
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    
    if (isMobile) {
      // Clear input and files immediately on mobile
      setInput("");
      setUploadedFiles([]);
      // Navigate immediately on mobile
      navigate(`/projects/plc-copilot/project/${sessionId}?prompt=${encodeURIComponent(input.trim())}`);
    } else {
      // Start transition animation on desktop
      setIsTransitioning(true);
      
      // Add the user message to show the transition
      const userMessage: Message = {
        id: Date.now().toString(),
        content: input.trim(),
        role: "user",
        timestamp: new Date()
      };
      setMessages([userMessage]);

      // Clear input and files for the transition
      setInput("");
      setUploadedFiles([]);

      // Wait for animation to complete, then navigate
      setTimeout(() => {
        navigate(`/projects/plc-copilot/project/${sessionId}?prompt=${encodeURIComponent(input.trim())}`);
      }, 800); // 800ms animation duration
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(async (file) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      let content: string | null = null;
      try {
        // Try to read text content for common text-like files
        content = await file.text();
      } catch (err) {
        // Non-text files (pdf, images) will not have readable text; leave content null
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

      // Auto-select the newly added file
      setSelectedFileId(id);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    setSelectedFileId((current) => (current === fileId ? null : current));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only allow Enter to submit on desktop (lg screens and above)
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth >= 1024) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className={`border-b border-gray-800 px-6 py-4 transition-all duration-700 flex-shrink-0 ${
        isTransitioning ? 'opacity-50' : 'opacity-100'
      }`}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">PLC Copilot</h1>
              <ConnectionStatus className="mt-1" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            <Link 
              to="/projects/plc-copilot/session"
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Chat Area with animated width constraint */}
      <main className="flex-1 flex relative min-h-0">
        {/* Chat Container with animated width */}
        <div className={`flex flex-col min-h-0 ${
          isTransitioning 
            ? 'lg:w-1/4 w-full transition-all duration-700 ease-in-out' 
            : 'w-full'
        }`}>
          <div className="max-w-4xl mx-auto w-full h-full flex flex-col min-h-0">
            

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-8 min-h-0">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-orange-500" />
                  </div>
                  <h2 className="text-xl font-medium text-white mb-2">Welcome to PLC Copilot</h2>
                  <p className="text-sm">Your intelligent assistant for PLC programming and automation tasks.</p>
                  <p className="text-sm mt-2">Ask questions about ladder logic, function blocks, or troubleshooting.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
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
                      <div className="bg-gray-800 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-800 p-6 flex-shrink-0">
              <form onSubmit={handleSubmit} className="relative">
                {/* If a file is selected, show filename/header above the textarea */}
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
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about PLC programming, ladder logic, or automation..."
                    className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-24 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400`}
                    rows={2}
                    style={{ minHeight: "64px", maxHeight: "120px" }}
                  />
                  
                  {/* Attachment button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.csv,.json,.xml,.plc,.l5x"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  
                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
              
              <p className="text-xs text-gray-500 mt-2 text-center hidden lg:block">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>

        {/* Animated right border/divider - Desktop only */}
        {isTransitioning && (
          <div className="hidden lg:block w-1 bg-gray-800 animate-pulse"></div>
        )}

        {/* Future output area placeholder (invisible during transition) - Desktop only */}
        {isTransitioning && (
          <div className="hidden lg:block flex-1 bg-gray-900 opacity-20"></div>
        )}
      </main>
    </div>
  );
}