import { useState } from "react";
import { Link } from "@remix-run/react";
import { ArrowLeft, MessageSquare, Trash2, Plus, Calendar, Clock } from "lucide-react";

interface Session {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

export default function PLCCopilotSession() {
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: "1",
      name: "Ladder Logic Debugging",
      lastMessage: "How do I troubleshoot a timer that's not working?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      messageCount: 8
    },
    {
      id: "2", 
      name: "Function Block Programming",
      lastMessage: "Can you explain how to create custom function blocks?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      messageCount: 15
    },
    {
      id: "3",
      name: "HMI Integration",
      lastMessage: "Setting up communication between PLC and HMI",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      messageCount: 23
    }
  ]);

  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());

  const handleSelectSession = (sessionId: string) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  const handleDeleteSelected = () => {
    setSessions(prev => prev.filter(session => !selectedSessions.has(session.id)));
    setSelectedSessions(new Set());
  };

  const createNewSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      name: "New Session",
      lastMessage: "",
      timestamp: new Date(),
      messageCount: 0
    };
    setSessions(prev => [newSession, ...prev]);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
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
              <h1 className="text-xl font-semibold">Session Management</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedSessions.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedSessions.size})
              </button>
            )}
            <button
              onClick={createNewSession}
              className="px-3 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {sessions.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">No Sessions Yet</h2>
            <p className="text-sm mb-4">Create your first session to start chatting with PLC Copilot.</p>
            <button
              onClick={createNewSession}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create New Session
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Sessions</h2>
              <p className="text-gray-400 text-sm">{sessions.length} total sessions</p>
            </div>
            
            <div className="grid gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`bg-gray-800 border rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer ${
                    selectedSessions.has(session.id) ? 'ring-2 ring-orange-500 border-orange-500' : 'border-gray-700'
                  }`}
                  onClick={() => handleSelectSession(session.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-white mb-1">{session.name}</h3>
                      {session.lastMessage && (
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">{session.lastMessage}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(session.timestamp)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {session.messageCount} messages
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {session.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <input
                        type="checkbox"
                        checked={selectedSessions.has(session.id)}
                        onChange={() => handleSelectSession(session.id)}
                        className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}