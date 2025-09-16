import { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";
import { apiClient } from "~/lib/api-client";

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className = "" }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>("");

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const connected = await apiClient.healthCheck();
      setIsConnected(connected);
      if (connected) {
        const url = await apiClient.getBaseUrl();
        setCurrentUrl(url);
      }
    } catch {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
        <div 
          className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
          title="Checking connection..."
        ></div>
        <span className="text-xs hidden sm:inline">Checking connection...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isConnected ? (
        <>
          <div title={`Connected to ${currentUrl || 'backend'}`}>
            <Wifi className="w-3 h-3 text-green-500" />
          </div>
          <span className="text-xs text-green-500 hidden sm:inline">Connected to {currentUrl || 'backend'}</span>
        </>
      ) : (
        <>
          <div title="Backend offline">
            <WifiOff className="w-3 h-3 text-red-500" />
          </div>
          <span className="text-xs text-red-500 hidden sm:inline">Backend offline</span>
          <button
            onClick={checkConnection}
            disabled={isChecking}
            className="text-xs text-orange-500 hover:text-orange-400 underline disabled:opacity-50 hidden sm:inline"
          >
            {isChecking ? "Checking..." : "Retry"}
          </button>
        </>
      )}
    </div>
  );
}

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({ error, onRetry, className = "" }: ErrorMessageProps) {
  return (
    <div className={`flex items-start gap-2 p-3 bg-red-900/20 border border-red-700/30 rounded-lg ${className}`}>
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-300">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-orange-500 hover:text-orange-400 underline mt-1"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}