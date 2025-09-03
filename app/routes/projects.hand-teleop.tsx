import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useState, useEffect, useRef } from "react";
// HandTrackingAPI for websocket integration based on backend guide
interface BackendTrackingResult {
  success: boolean;
  timestamp: string;
  hand_detected: boolean;
  fingertip_coords?: {
    thumb_tip: { x: number; y: number; z: number };
    index_tip: { x: number; y: number; z: number };
    index_pip: { x: number; y: number; z: number };
    index_mcp: { x: number; y: number; z: number };
  } | null;
  hand_pose?: {
    landmarks: Array<{ x: number; y: number; z: number }>;
    score: number;
  };
  robot_joints?: number[];
  robot_pose?: any;
  processing_time_ms: number;
  message: string;
  latency_ms?: number; // Added for round-trip latency
  queue_depth?: number; // Added for queue monitoring
}

class HandTrackingAPI {
  apiUrl: string;
  ws: WebSocket | null;
  onTrackingResult: ((result: BackendTrackingResult) => void) | null;
  onConnectionChange: ((connected: boolean) => void) | null;
  onError: ((error: string) => void) | null;
  isConnected: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  lastFrameTime: number;
  frameQueue: number;
  maxFrameQueue: number;
  useRestApi: boolean; // Flag for REST API fallback
  queueResetInterval: NodeJS.Timeout | null; // Queue cleanup

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl.replace('https:', 'wss:').replace('http:', 'ws:');
    this.ws = null;
    this.onTrackingResult = null;
    this.onConnectionChange = null;
    this.onError = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.lastFrameTime = 0;
    this.frameQueue = 0;
    this.maxFrameQueue = 3; // Prevent queue overflow
    this.useRestApi = false; // Start with WebSocket, fallback to REST
    this.queueResetInterval = null;
    
    // Set up queue reset mechanism to prevent stuck frames
    this.queueResetInterval = setInterval(() => {
      if (this.frameQueue > 0) {
        console.log(`🔄 Queue cleanup: resetting queue from ${this.frameQueue} to 0`);
        this.frameQueue = 0;
      }
    }, 10000); // Reset queue every 10 seconds
  }

  connect() {
    return new Promise<void>((resolve, reject) => {
      try {
        // Use the exact WebSocket endpoint from the backend guide
        const wsUrl = `${this.apiUrl}/api/tracking/live`;
        console.log('🔌 Attempting WebSocket connection to:', wsUrl);
        console.log('🔧 API URL breakdown:', {
          original: this.apiUrl,
          wsUrl,
          isOnline: this.apiUrl.includes('onrender.com'),
          protocol: wsUrl.startsWith('wss:') ? 'secure' : 'insecure'
        });
        
        // Set up connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.error('❌ WebSocket connection timeout after 15 seconds');
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, CONNECTION_TIMEOUT);
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully!');
          clearTimeout(connectionTimeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          if (this.onConnectionChange) this.onConnectionChange(true);
          
          // Send ping to test connection
          this.ws?.send(JSON.stringify({ type: 'ping' }));
          resolve();
        };
        
        this.ws.onmessage = (event: MessageEvent) => {
          try {
            const response = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', response.type); // Less verbose logging
            
            if (response.type === 'pong') {
              console.log('🏓 Pong received - server is responsive');
            } else if (response.type === 'tracking_result' && this.onTrackingResult) {
              console.log('🎯 Processing tracking result - hand detected:', response.data?.hand_detected); // More specific logging
              // Calculate round-trip latency
              const now = Date.now();
              const latency = now - this.lastFrameTime;
              this.frameQueue = Math.max(0, this.frameQueue - 1);
              
              // Add latency info to result - ensure we use the correct data structure
              const resultWithLatency = {
                ...response.data, // Use response.data which contains the actual tracking result
                latency_ms: latency,
                queue_depth: this.frameQueue
              };
              
              this.onTrackingResult(resultWithLatency);
              
              // Log performance metrics occasionally
              if (Math.random() < 0.1) { // 10% of results for more debugging
                console.log(`📊 Latency: ${latency}ms, Queue: ${this.frameQueue}, Processing: ${response.data.processing_time_ms?.toFixed(1)}ms, Hand: ${response.data.hand_detected}`);
              }
            } else if (response.type === 'error') {
              console.error('❌ Backend error:', response.message);
              if (this.onError) this.onError(`Backend: ${response.message}`);
            } else {
              console.log('📋 Unknown message type:', response.type, 'Data keys:', Object.keys(response));
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
            console.error('Raw message:', event.data);
            if (this.onError) this.onError(`Parse error: ${error}`);
          }
        };
        
        this.ws.onerror = (error: Event) => {
          console.error('❌ WebSocket error event:', error);
          console.error('❌ WebSocket details:', {
            url: wsUrl,
            readyState: this.ws?.readyState,
            protocol: this.ws?.protocol,
            extensions: this.ws?.extensions
          });
          clearTimeout(connectionTimeout);
          if (this.onError) this.onError(`WebSocket connection failed to ${wsUrl}`);
          reject(new Error('WebSocket error'));
        };
        
        this.ws.onclose = (event: CloseEvent) => {
          console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason || 'Unknown reason'}`);
          console.log(`📊 Connection was open for: ${Date.now() - this.lastFrameTime}ms`);
          clearTimeout(connectionTimeout);
          this.isConnected = false;
          if (this.onConnectionChange) this.onConnectionChange(false);
          
          // Improved auto-reconnect logic based on close codes
          const shouldReconnect = (
            event.code !== 1000 && // Not a normal close
            event.code !== 1001 && // Not "going away"
            this.reconnectAttempts < this.maxReconnectAttempts
          );
          
          if (shouldReconnect) {
            this.reconnectAttempts++;
            const delay = Math.min(2000 * this.reconnectAttempts, 10000); // Max 10 seconds
            console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect().catch(console.error), delay);
          } else if (event.code !== 1000) {
            // First connection failed or max retries reached
            const errorMsg = `Connection failed: ${event.code} ${event.reason}`;
            console.error('❌ WebSocket connection permanently failed:', errorMsg);
            if (this.onError) this.onError(errorMsg);
            reject(new Error(errorMsg));
          }
        };
      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        if (this.onError) this.onError(`Setup failed: ${error}`);
        reject(error);
      }
    });
  }

  sendFrame(canvas: HTMLCanvasElement, trackingMode: string = 'mediapipe', robotType: string = 'so101'): boolean {
    if (this.useRestApi) {
      // For REST API, we need to handle it differently since it's async
      this.sendFrameRest(canvas, trackingMode, robotType).catch(error => {
        console.error('❌ REST API frame send failed:', error);
        if (this.onError) this.onError(`REST API error: ${error}`);
      });
      return true; // Return true to indicate attempt was made
    }
    
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not connected, cannot send frame');
      // Try to enable REST API fallback
      if (!this.useRestApi) {
        console.log('🔄 Switching to REST API fallback...');
        this.useRestApi = true;
        if (this.onError) this.onError('WebSocket failed - switched to REST API');
        return this.sendFrame(canvas, trackingMode, robotType); // Retry with REST
      }
      return false;
    }
    
    // Skip frame if queue is full (prevents overwhelming backend)
    if (this.frameQueue >= this.maxFrameQueue) {
      console.warn(`⚠️ Skipping frame - queue full (${this.frameQueue}/${this.maxFrameQueue})`);
      return false;
    }
    
    try {
      // Use optimal image quality as per documentation
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      const message = {
        type: 'image', // Backend expects 'image' type as per WEB_INTEGRATION.md
        data: imageData, // Direct data field, not nested
        tracking_mode: trackingMode,
        timestamp: new Date().toISOString()
      };
      
      this.ws.send(JSON.stringify(message));
      this.lastFrameTime = Date.now();
      this.frameQueue++;
      
      // Log frame sending occasionally for debugging (less verbose)
      if (Math.random() < 0.02) { // 2% of frames
        console.log('📤 WebSocket frame sent:', { 
          type: message.type, 
          tracking_mode: message.tracking_mode,
          data_size: Math.round(imageData.length / 1024) + 'KB',
          queue: this.frameQueue,
          wsState: this.ws.readyState
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error sending frame via WebSocket:', error);
      if (this.onError) this.onError(`Error sending frame: ${error}`);
      
      // Try REST API fallback on WebSocket send error
      console.log('🔄 WebSocket send failed, trying REST API fallback...');
      this.useRestApi = true;
      return this.sendFrame(canvas, trackingMode, robotType); // Retry with REST
    }
  }

  async sendFrameRest(canvas: HTMLCanvasElement, trackingMode: string = 'mediapipe', robotType: string = 'so101'): Promise<boolean> {
    try {
      // Skip frame if queue is full (prevents overwhelming backend)
      if (this.frameQueue >= this.maxFrameQueue) {
        console.warn(`⚠️ Skipping REST frame - queue full (${this.frameQueue}/${this.maxFrameQueue})`);
        return false;
      }

      const imageData = canvas.toDataURL('image/jpeg', 0.8); // Use same quality as WebSocket
      const restApiUrl = this.apiUrl.replace('wss:', 'https:').replace('ws:', 'http:');
      
      // Use the correct format for the REST API endpoint
      const requestBody = {
        image_data: imageData, // REST API expects 'image_data' field
        tracking_mode: trackingMode,
        robot_type: robotType,
        timestamp: new Date().toISOString()
      };

      console.log(`📤 Sending REST request to: ${restApiUrl}/api/track`);

      // Create abort controller for timeout (compatible with all browsers)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('⏰ REST API request timed out after 10 seconds');
      }, 10000);

      const response = await fetch(`${restApiUrl}/api/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        // Add mode for CORS handling
        mode: 'cors',
        // Add credentials if needed
        credentials: 'omit'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📨 REST API response received');

      // Convert REST response to match WebSocket format and trigger callback
      if (this.onTrackingResult) {
        const latency = Date.now() - this.lastFrameTime;
        const resultWithLatency = {
          ...result,
          latency_ms: latency,
          queue_depth: this.frameQueue
        };
        this.onTrackingResult(resultWithLatency);
      }

      this.lastFrameTime = Date.now();
      this.frameQueue = Math.max(0, this.frameQueue - 1); // Decrease queue on successful response
      return true;
    } catch (error) {
      // Enhanced error handling for different types of fetch failures
      let errorMessage = 'Unknown error';
      let isCorsError = false;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout (10s)';
        } else if (error.message.includes('Failed to fetch')) {
          // This is typically a CORS error or network issue
          isCorsError = true;
          const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
          const targetUrl = `${this.apiUrl.replace('wss:', 'https:').replace('ws:', 'http:')}/api/track`;
          
          // Detect if this is likely a CORS issue based on origin mismatch
          if (currentOrigin.includes('localhost') && targetUrl.includes('onrender.com')) {
            errorMessage = 'CORS: Development server not allowed by backend. Use production deployment or configure CORS.';
          } else if (currentOrigin.includes('localhost') && targetUrl.includes('localhost')) {
            errorMessage = 'Network: Local backend server not running or unreachable.';
          } else {
            errorMessage = 'Network: Failed to connect to backend server.';
          }
        } else if (error.message.includes('NetworkError')) {
          errorMessage = 'Network connection failed';
        } else if (error.message.includes('CORS')) {
          isCorsError = true;
          errorMessage = 'CORS policy blocked request - server configuration issue';
        } else if (error.message.includes('HTTP 4')) {
          errorMessage = `Client error: ${error.message}`;
        } else if (error.message.includes('HTTP 5')) {
          errorMessage = `Server error: ${error.message}`;
        } else {
          errorMessage = error.message;
        }
      }
      
      console.error('❌ REST API error:', errorMessage, error);
      console.error('🔍 Debug info:', {
        currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
        targetUrl: `${this.apiUrl.replace('wss:', 'https:').replace('ws:', 'http:')}/api/track`,
        errorName: error instanceof Error ? error.name : 'unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        isCorsError: isCorsError
      });
      
      // Provide actionable error message
      if (isCorsError) {
        if (this.onError) this.onError(`CORS: ${errorMessage}`);
      } else {
        if (this.onError) this.onError(`REST API: ${errorMessage}`);
      }
      
      this.frameQueue = Math.max(0, this.frameQueue - 1); // Decrease queue even on error
      return false;
    }
  }

  calculatePinchDistance(fingertips: any): number {
    if (!fingertips?.thumb_tip || !fingertips?.index_tip) {
      return 1; // Max distance when no fingertips available
    }
    
    const dx = fingertips.thumb_tip.x - fingertips.index_tip.x;
    const dy = fingertips.thumb_tip.y - fingertips.index_tip.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  disconnect() {
    // Clean up queue reset timer
    if (this.queueResetInterval) {
      clearInterval(this.queueResetInterval);
      this.queueResetInterval = null;
    }
    
    if (this.useRestApi) {
      this.isConnected = false;
      this.useRestApi = false;
      if (this.onConnectionChange) this.onConnectionChange(false);
    } else if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
      this.isConnected = false;
    }
    
    // Reset frame queue on disconnect
    this.frameQueue = 0;
  }
}
import { 
  Camera, 
  CameraOff, 
  Power, 
  PowerOff, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Settings,
  Activity,
  Zap,
  Play,
  ArrowLeft,
  Github,
  Hand,
  Monitor,
  Cpu,
  Pause,
} from "lucide-react";

export const loader = async () => {
  return json({});
};

// Configuration for different environments
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Connection timeout settings  
const CONNECTION_TIMEOUT = 15000; // 15 seconds as per docs
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
const OPTIMAL_FPS = 15; // 15 FPS as recommended in docs
const FRAME_INTERVAL = 1000 / OPTIMAL_FPS; // ~67ms between frames

const ROBOTS = [
  { id: 'ur5e', name: 'UR5e', dof: 6, description: 'Universal Robots collaborative arm for precise manipulation' },
  { id: 'franka', name: 'Franka Emika Panda', dof: 7, description: 'Research robot with torque sensors in every joint' },
  { id: 'kinova', name: 'Kinova Gen3', dof: 7, description: 'Lightweight carbon fiber arm for research applications' },
  { id: 'kuka', name: 'KUKA LBR iiwa', dof: 7, description: 'Sensitive lightweight robot for human-robot collaboration' },
  { id: 'so101', name: 'SO-101 Humanoid Hand', dof: 5, description: 'Dexterous robotic hand' },
  { id: 'simulation', name: 'Simulation Mode', dof: 6, description: 'Virtual robot for testing' }
];

const HAND_MODELS = [
  { id: 'mediapipe', name: 'MediaPipe Hands', description: 'Real-time hand landmark detection' },
  { id: 'wilor', name: 'WiLoR', description: 'Whole-body human mesh recovery' }
];

interface FingertipData {
  thumb: { x: number; y: number; z: number } | null;
  indexPip: { x: number; y: number; z: number } | null;
  indexTip: { x: number; y: number; z: number } | null;
  timestamp: number;
}

interface RobotState {
  jointAngles: number[];
  endEffectorPose: {
    position: { x: number; y: number; z: number };
    orientation: { roll: number; pitch: number; yaw: number };
  };
  gripperState: 'open' | 'closed';
  inWorkspace: boolean;
  confidence: number;
}


export default function HandTeleopProject() {
  // State management
  const [selectedRobot, setSelectedRobot] = useState('ur5e');
  const [selectedModel, setSelectedModel] = useState('mediapipe');
  const [isConnected, setIsConnected] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [useOnlineServer, setUseOnlineServer] = useState(false);
  // Output console state
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  // Dynamic API URLs based on server selection
  const API_BASE = useOnlineServer 
    ? "https://hand-teleop-api.onrender.com" 
    : (isDevelopment ? "http://localhost:8000" : "https://hand-teleop-api.onrender.com");
  const WS_BASE = useOnlineServer 
    ? "wss://hand-teleop-api.onrender.com" 
    : (isDevelopment ? "ws://localhost:8000" : "wss://hand-teleop-api.onrender.com");

  // Data state - Updated for real backend integration
  const [trackingResult, setTrackingResult] = useState<BackendTrackingResult | null>(null);
  const [handVisible, setHandVisible] = useState(false);
  const [gripperClosed, setGripperClosed] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [wsConnecting, setWsConnecting] = useState(false);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const handTrackingApiRef = useRef<HandTrackingAPI | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Legacy data state for robot visualization
  const [fingertipData, setFingertipData] = useState<FingertipData>({
    thumb: null,
    indexPip: null,
    indexTip: null,
    timestamp: 0
  });
  const [robotState, setRobotState] = useState<RobotState>({
    jointAngles: [0, 0, 0, 0, 0, 0],
    endEffectorPose: {
      position: { x: 0, y: 0, z: 0 },
      orientation: { roll: 0, pitch: 0, yaw: 0 }
    },
    gripperState: 'open',
    inWorkspace: true,
    confidence: 0
  });

  // Refs for camera and canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to log messages
  const addToConsole = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  // Check API status on mount and when server selection changes
  useEffect(() => {
    checkApiStatus();
  }, [useOnlineServer]);

  // Auto-detect best server on mount (development only)
  useEffect(() => {
    if (isDevelopment && apiStatus === 'idle') {
      addToConsole('🔍 Auto-detecting best server for development...');
      // Always start with local in development
      setUseOnlineServer(false);
    }
  }, []); // Only run on mount

  // Reconnect WebSocket when server selection changes
  useEffect(() => {
    if (isCameraActive) {
      addToConsole('🔄 Server changed, reconnecting WebSocket...');
      setupWebSocketConnection();
    }
  }, [useOnlineServer, isCameraActive]);

  const checkApiStatus = async () => {
    try {
      setApiStatus('checking');
      addToConsole(`🔍 Checking backend API health at ${API_BASE}/health...`);
      
      // Add timeout for health check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
      
      const response = await fetch(`${API_BASE}/health`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setApiStatus('connected');
        addToConsole(`✅ Backend API connected: ${data.message || 'Health check passed'}`);
        addToConsole(`🔗 Using API: ${API_BASE}`);
      } else {
        setApiStatus('error');
        addToConsole(`❌ Backend API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setApiStatus('timeout');
        addToConsole(`⏰ Backend API timeout (>${HEALTH_CHECK_TIMEOUT / 1000}s)`);
      } else if (error instanceof Error && error.message.includes('Failed to fetch')) {
        // Handle CORS errors specifically
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
        if (currentOrigin.includes('localhost') && API_BASE.includes('onrender.com')) {
          setApiStatus('cors');
          addToConsole(`❌ CORS: Development server (${currentOrigin}) not allowed by backend`);
          addToConsole(`💡 Suggestion: Deploy frontend or run backend locally on port 8000`);
        } else {
          setApiStatus('error');
          addToConsole(`❌ Backend API connection failed: ${error.message}`);
        }
      } else {
        setApiStatus('error');
        addToConsole(`❌ Backend API connection failed: ${error}`);
      }
      
      // Note: CORS errors or timeouts are expected for some deployments
      console.warn('Health check failed, but WebSocket may still work:', error);
    }
  };

  // Setup WebSocket connection for hand tracking
  const setupWebSocketConnection = async () => {
    if (handTrackingApiRef.current) {
      handTrackingApiRef.current.disconnect();
    }

    try {
      setWsError(null);
      setWsConnecting(true);
      addToConsole('🔌 Establishing WebSocket connection...');
      addToConsole(`🔗 Target: ${WS_BASE}/api/tracking/live`);
      
      // Initialize HandTrackingAPI with WebSocket URL
      handTrackingApiRef.current = new HandTrackingAPI(WS_BASE);
      
      // Set up event handlers
      handTrackingApiRef.current.onConnectionChange = (connected: boolean) => {
        setWsConnected(connected);
        setWsConnecting(false);
        if (connected) {
          addToConsole('✅ WebSocket connected - ready for hand tracking');
          setWsError(null);
          // Auto-start tracking when WebSocket connects (camera is already active)
          setIsTracking(true);
          addToConsole(`▶️ Hand tracking started automatically at ${OPTIMAL_FPS} FPS`);
        } else {
          addToConsole('❌ WebSocket disconnected');
          setIsTracking(false); // Stop tracking when WebSocket disconnects
        }
      };

      handTrackingApiRef.current.onError = (error: string) => {
        setWsError(error);
        setWsConnecting(false);
        addToConsole(`❌ WebSocket error: ${error}`);
        
        // Provide specific guidance for common errors
        if (error.includes('Connection failed') || error.includes('WebSocket connection failed')) {
          const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
          if (currentOrigin.includes('localhost') && WS_BASE.includes('onrender.com')) {
            addToConsole('💡 Note: CORS may block REST API, but WebSocket connections often work');
            addToConsole('🔄 Attempting REST API fallback (may have CORS issues)...');
          } else {
            addToConsole('🔄 Attempting REST API fallback...');
          }
          
          if (handTrackingApiRef.current) {
            handTrackingApiRef.current.useRestApi = true;
            setWsError('Using REST API fallback - check console for CORS issues');
          }
        }
      };

      handTrackingApiRef.current.onTrackingResult = (result: BackendTrackingResult) => {
        handleTrackingResult(result);
      };

      // Connect to WebSocket with timeout handling
      await handTrackingApiRef.current.connect();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addToConsole(`❌ Failed to setup WebSocket: ${errorMessage}`);
      setWsError(`Connection failed: ${errorMessage}`);
      setWsConnecting(false);
      
      // Try REST API fallback
      if (handTrackingApiRef.current) {
        addToConsole('🔄 Switching to REST API fallback mode...');
        handTrackingApiRef.current.useRestApi = true;
        setWsError('WebSocket failed - using REST API fallback');
        setWsConnected(false); // Important: mark as not connected for UI
      }
      
      // Suggest local development if remote fails
      if (!isDevelopment && errorMessage.includes('timeout')) {
        addToConsole('💡 Tip: For development, run backend locally at localhost:8000');
      }
    }
  };

  // Handle tracking results from backend
  const handleTrackingResult = (result: BackendTrackingResult) => {
    setTrackingResult(result);
    setHandVisible(result.hand_detected);
    
    // Safely extract processing time
    const processingTime = result.processing_time_ms || 0;
    setProcessingTime(processingTime);
    
    // Update console with tracking info including performance metrics
    if (result.hand_detected && result.fingertip_coords) {
      const fingertips = result.fingertip_coords;
      const performanceInfo = result.latency_ms ? 
        ` | Latency: ${result.latency_ms.toFixed(1)}ms` : '';
      
      // Only log occasionally to reduce noise
      if (Math.random() < 0.1) { // 10% of successful detections
        addToConsole(`📍 Hand detected: thumb(${fingertips.thumb_tip.x.toFixed(3)}, ${fingertips.thumb_tip.y.toFixed(3)}) | Processing: ${processingTime.toFixed(1)}ms${performanceInfo}`);
      }
      
      // Calculate gripper state - using optimal sensitivity
      const pinchDistance = handTrackingApiRef.current?.calculatePinchDistance(fingertips) || 1;
      const isGripperClosed = pinchDistance < 0.08; // Optimal threshold from testing
      setGripperClosed(isGripperClosed);
      
      // Update legacy fingertip data for robot visualization
      setFingertipData({
        thumb: fingertips.thumb_tip,
        indexPip: fingertips.index_pip,
        indexTip: fingertips.index_tip,
        timestamp: Date.now()
      });

      // Update robot state based on hand data
      const newRobotState: RobotState = {
        jointAngles: [
          (fingertips.index_tip.x - 0.5) * 2, // Convert 0-1 to -1 to 1
          (fingertips.index_tip.y - 0.5) * 2,
          (fingertips.index_tip.z - 0.5) * 2,
          0, 0, 0
        ],
        endEffectorPose: {
          position: {
            x: (fingertips.index_tip.x - 0.5) * 1000, // Convert to mm
            y: (fingertips.index_tip.y - 0.5) * 1000,
            z: (fingertips.index_tip.z - 0.5) * 1000
          },
          orientation: { roll: 0, pitch: 0, yaw: 0 }
        },
        gripperState: isGripperClosed ? 'closed' : 'open',
        inWorkspace: true,
        confidence: result.hand_pose?.score || 0.9
      };
      setRobotState(newRobotState);

      // Note: Overlay drawing is handled by the main animation loop
    } else {
      const performanceInfo = result.latency_ms ? 
        ` | Latency: ${result.latency_ms.toFixed(1)}ms` : '';
      
      // Only log occasionally for no-hand cases too
      if (Math.random() < 0.05) { // 5% of no-hand cases
        addToConsole(`👻 No hand detected - ${result.message} | Processing: ${processingTime.toFixed(1)}ms${performanceInfo}`);
      }
      
      setGripperClosed(false);
      setFingertipData({
        thumb: null,
        indexPip: null,
        indexTip: null,
        timestamp: Date.now()
      });
      // Overlay clearing is handled by the main animation loop
    }
  };

  const startCamera = async () => {
    try {
      addToConsole('📹 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          facingMode: 'user' 
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          const video = videoRef.current!;
          const checkReady = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              addToConsole(`📹 Camera ready: ${video.videoWidth}x${video.videoHeight}`);
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          
          if (video.readyState >= 2) {
            checkReady();
          } else {
            video.addEventListener('loadeddata', checkReady, { once: true });
          }
        });
      }
      
      setIsCameraActive(true);
      addToConsole('✅ Camera started successfully and ready for tracking');
      
      // Automatically start WebSocket connection when camera starts
      setupWebSocketConnection();
    } catch (error) {
      console.error("Camera access denied:", error);
      addToConsole('❌ Camera access denied');
      alert("Camera access is required for hand tracking");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsTracking(false);
    setWsConnected(false);
    setWsError(null);
    setTrackingResult(null);
    setHandVisible(false);
    setGripperClosed(false);
    
    // Disconnect WebSocket
    if (handTrackingApiRef.current) {
      handTrackingApiRef.current.disconnect();
      handTrackingApiRef.current = null;
    }
    
    // Stop frame sending loop
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    addToConsole('Camera stopped and WebSocket disconnected');
  };

  const connectToRobot = async () => {
    try {
      addToConsole(`🤖 Connecting to robot control: ${selectedRobot}`);
      const response = await fetch(`${API_BASE}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robot_type: selectedRobot })
      });
      
      if (response.ok) {
        setIsConnected(true);
        addToConsole('✅ Robot control connected successfully');
        addToConsole('💡 Note: Hand tracking works independently of robot connection');
      } else {
        addToConsole('❌ Failed to connect to robot control');
        alert("Failed to connect to robot");
      }
    } catch (error) {
      addToConsole('❌ Robot connection error');
      alert("Connection error");
    }
  };

  const startTracking = () => {
    if (!isCameraActive) {
      addToConsole('❌ Please start camera first');
      alert("Please start camera first");
      return;
    }
    
    if (!handTrackingApiRef.current) {
      addToConsole('❌ No tracking API available. Please wait for connection...');
      setupWebSocketConnection(); // Try to reconnect
      return;
    }
    
    // Allow tracking with either WebSocket or REST API fallback
    const hasConnection = wsConnected || handTrackingApiRef.current.useRestApi;
    
    if (!hasConnection) {
      addToConsole('⚠️ No connection available. Attempting to connect...');
      setupWebSocketConnection(); // Try to reconnect
      return;
    }
    
    setIsTracking(true);
    const connectionMode = handTrackingApiRef.current.useRestApi ? 'REST API fallback' : 'WebSocket';
    addToConsole(`▶️ Starting hand tracking at ${OPTIMAL_FPS} FPS via ${connectionMode}`);
  };

  const stopTracking = () => {
    setIsTracking(false);
    addToConsole('⏹️ Hand tracking stopped - WebSocket remains connected');
    
    // Clear any pending frame intervals
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Note: We keep the WebSocket connected for quick restart
    // Only disconnect when camera is stopped completely
  };

  // Debug function to check current state
  const debugCurrentState = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const debugInfo = {
      'Camera Active': isCameraActive,
      'WebSocket Connected': wsConnected,
      'Tracking Active': isTracking,
      'Video Element': !!video,
      'Video Dimensions': video ? `${video.videoWidth}x${video.videoHeight}` : 'N/A',
      'Video Ready State': video?.readyState || 'N/A',
      'Canvas Element': !!canvas,
      'WebSocket API': !!handTrackingApiRef.current,
      'Frame Interval': !!frameIntervalRef.current,
      'Selected Model': selectedModel,
      'Selected Robot': selectedRobot,
      'Use REST API': handTrackingApiRef.current?.useRestApi || false,
      'Frame Queue': handTrackingApiRef.current?.frameQueue || 0,
      'WS Ready State': handTrackingApiRef.current?.ws?.readyState || 'N/A'
    };
    
    addToConsole('🔍 Debug State:');
    Object.entries(debugInfo).forEach(([key, value]) => {
      addToConsole(`  ${key}: ${value}`);
    });
    
    console.log('Debug State:', debugInfo);
    
    // Try to send a test frame manually
    if (video && canvas && handTrackingApiRef.current && (wsConnected || handTrackingApiRef.current.useRestApi)) {
      addToConsole('🧪 Attempting manual frame send...');
      try {
        const ctx = canvas.getContext('2d');
        if (ctx && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const success = handTrackingApiRef.current.sendFrame(canvas, selectedModel, selectedRobot);
          addToConsole(`🧪 Manual frame send: ${success ? 'SUCCESS' : 'FAILED'}`);
        } else {
          addToConsole('🧪 Manual frame send failed: No context or video not ready');
        }
      } catch (error) {
        addToConsole(`🧪 Manual frame send error: ${error}`);
      }
    } else {
      addToConsole('🧪 Manual frame send skipped: Missing requirements');
    }
  };

  // Send frames to backend via WebSocket or REST API fallback - Optimal rate for performance
  const sendFramesLoop = () => {
    if (!isTracking) {
      return; // Tracking not active
    }
    
    if (!videoRef.current || !canvasRef.current || !handTrackingApiRef.current) {
      return; // Required elements not available
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // For REST API fallback, we don't need WebSocket connection
    const hasConnection = wsConnected || handTrackingApiRef.current.useRestApi;
    
    if (!hasConnection) {
      return; // No connection available
    }
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return; // Video not ready
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return; // No canvas context
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      // Send frame to backend with selected model and robot
      const success = handTrackingApiRef.current.sendFrame(canvas, selectedModel, selectedRobot);
      
      // Log frame sending occasionally for debugging
      const now = Date.now();
      if (now - lastFrameTimeRef.current > 5000) { // Log every 5 seconds
        const apiMode = handTrackingApiRef.current.useRestApi ? 'REST API' : 'WebSocket';
        const connectionStatus = wsConnected ? 'Connected' : 'Fallback';
        addToConsole(`📹 ${success ? 'Sending' : 'Failed to send'} frames via ${apiMode} (${connectionStatus})`);
        lastFrameTimeRef.current = now;
      }
    } catch (error) {
      console.error('❌ Error in sendFramesLoop:', error);
      addToConsole(`❌ Frame send error: ${error}`);
    }
  };

  // Start/stop frame sending with proper interval
  useEffect(() => {
    // Check if we have either WebSocket connection or REST API fallback
    const hasConnection = wsConnected || (handTrackingApiRef.current?.useRestApi);
    
    if (isTracking && hasConnection) {
      // Use optimal frame rate as per documentation (15 FPS)
      frameIntervalRef.current = setInterval(sendFramesLoop, FRAME_INTERVAL);
      const connectionMode = handTrackingApiRef.current?.useRestApi ? 'REST API' : 'WebSocket';
      addToConsole(`▶️ Started sending frames at ${OPTIMAL_FPS} FPS via ${connectionMode}`);
      
      // Add periodic connection health check (only for WebSocket)
      let healthCheckInterval: NodeJS.Timeout | null = null;
      if (wsConnected && handTrackingApiRef.current?.ws) {
        healthCheckInterval = setInterval(() => {
          if (handTrackingApiRef.current?.ws) {
            const wsState = handTrackingApiRef.current.ws.readyState;
            console.log(`💓 WebSocket health check: state=${wsState}, queue=${handTrackingApiRef.current.frameQueue}`);
            
            if (wsState !== WebSocket.OPEN) {
              console.warn('⚠️ WebSocket connection lost during tracking!');
              addToConsole('❌ WebSocket connection lost - attempting fallback');
              setIsTracking(false);
              
              // Try to enable REST API fallback
              if (handTrackingApiRef.current) {
                handTrackingApiRef.current.useRestApi = true;
                setWsError('WebSocket lost - switched to REST API');
                addToConsole('🔄 Switched to REST API fallback mode');
              }
            }
          }
        }, 5000); // Check every 5 seconds
      }
      
      return () => {
        if (healthCheckInterval) {
          clearInterval(healthCheckInterval);
        }
      };
    } else {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isTracking, wsConnected, selectedModel, selectedRobot]);

  // Overlay drawing functions for backend integration
  const drawHandOverlay = (fingertips: BackendTrackingResult['fingertip_coords'], isGripperClosed: boolean) => {
    if (!overlayCanvasRef.current || !fingertips) return;
    
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Convert normalized coordinates (0-1) to canvas pixels
    const convertCoord = (coord: { x: number; y: number; z: number }) => ({
      x: coord.x * canvas.width,
      y: coord.y * canvas.height,
      z: coord.z
    });
    
    // Clear previous overlay points (but keep video frame)
    // We don't clear here since the main overlay loop handles video frame drawing
    
    // Draw fingertip points with proper coordinate conversion
    const radius = 8;
    ctx.lineWidth = 2;
    
    // Draw thumb tip
    if (fingertips.thumb_tip) {
      const thumbPos = convertCoord(fingertips.thumb_tip);
      ctx.fillStyle = isGripperClosed ? '#ff8800' : '#10b981';
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(thumbPos.x, thumbPos.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Add label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('T', thumbPos.x, thumbPos.y - 12);
    }
    
    // Draw index tip
    if (fingertips.index_tip) {
      const indexPos = convertCoord(fingertips.index_tip);
      ctx.fillStyle = isGripperClosed ? '#ff8800' : '#10b981';
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(indexPos.x, indexPos.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Add label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('I', indexPos.x, indexPos.y - 12);
    }
    
    // Draw connection line for pinch visualization
    if (fingertips.thumb_tip && fingertips.index_tip && isGripperClosed) {
      const thumbPos = convertCoord(fingertips.thumb_tip);
      const indexPos = convertCoord(fingertips.index_tip);
      
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]); // Dashed line for pinch
      ctx.beginPath();
      ctx.moveTo(thumbPos.x, thumbPos.y);
      ctx.lineTo(indexPos.x, indexPos.y);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    }
    
    // Draw additional tracking points for debugging
    if (fingertips.index_pip) {
      const pipPos = convertCoord(fingertips.index_pip);
      ctx.fillStyle = 'rgba(100, 100, 255, 0.7)';
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pipPos.x, pipPos.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    
    if (fingertips.index_mcp) {
      const mcpPos = convertCoord(fingertips.index_mcp);
      ctx.fillStyle = 'rgba(255, 255, 100, 0.7)';
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mcpPos.x, mcpPos.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  };
  
  const clearHandOverlay = () => {
    if (!overlayCanvasRef.current) return;
    const ctx = overlayCanvasRef.current.getContext('2d');
    if (ctx && videoRef.current && videoRef.current.videoWidth > 0) {
      // Clear the canvas
      ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      // Redraw the video frame to preserve video display
      ctx.drawImage(videoRef.current, 0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
  };

  // Enhanced overlay drawing loop that efficiently handles real-time tracking data
  useEffect(() => {
    if (!overlayCanvasRef.current || !videoRef.current || !isCameraActive) return;
    
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    
    const drawFrame = () => {
      if (!isCameraActive || !video || !ctx || video.videoWidth === 0) return;
      
      // Set canvas size to match video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      
      // Always draw the video frame first
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Draw real-time tracking data if available
      if (trackingResult?.fingertip_coords && handVisible) {
        // Draw tracking overlay using the dedicated function
        drawHandOverlay(trackingResult.fingertip_coords, gripperClosed);
      }
      
      // Draw enhanced status overlay
      drawStatusOverlay(ctx, canvas);
      
      // Continue the animation loop
      if (isCameraActive) {
        animationId = requestAnimationFrame(drawFrame);
      }
    };
    
    // Start the drawing loop
    if (video.readyState >= 2) { // Video has enough data
      drawFrame();
    } else {
      video.addEventListener('loadeddata', drawFrame, { once: true });
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [trackingResult, handVisible, gripperClosed, isTracking, isCameraActive]);

  // Enhanced status overlay function
  const drawStatusOverlay = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Minimal overlay - no background boxes or text
    // Status is now shown via the top-left icon overlay
    
    // Reset text alignment and font for other elements
    ctx.textAlign = 'left';
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'white';
    
    // Draw main status icon in bottom center
    const centerX = canvas.width / 2;
    const bottomY = canvas.height - 30;
    
    // Background for status icon
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(centerX - 30, bottomY - 25, 60, 35);
    
    // Status icon
    ctx.textAlign = 'center';
    ctx.font = '20px sans-serif';
    
    if (isTracking && handVisible) {
      ctx.fillStyle = gripperClosed ? '#ff4444' : '#00ff00';
      ctx.fillText(gripperClosed ? '🤏' : '✋', centerX, bottomY);
    } else if (isTracking) {
      ctx.fillStyle = '#ffaa00';
      ctx.fillText('�️', centerX, bottomY);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('⏸️', centerX, bottomY);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out border-b bg-gray-800/70 backdrop-blur-md border-gray-700/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link to="/">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
                <span className="text-white font-bold text-lg">JP</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2 text-sm font-medium text-gray-300 hover:text-orange-500 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-20 px-6 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-white">
            Hand Teleop System
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Control robots with natural hand movements
          </p>
        </div>

        {/* Main Interface */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Robot Visualization */}
          <Card className="bg-gray-800 border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Monitor className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">Robot</h2>
              <Badge variant={isConnected ? "default" : "secondary"} className="ml-auto">
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Robot Embodiment</label>
                <select 
                  value={selectedRobot}
                  onChange={(e) => setSelectedRobot(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  {ROBOTS.map(robot => (
                    <option key={robot.id} value={robot.id} className="bg-gray-800 text-white">
                      {robot.name} ({robot.dof} DOF)
                    </option>
                  ))}
                </select>
              </div>

              {/* 3D Robot Visualization Area */}
              <div className="aspect-square bg-gray-900 rounded-lg border-2 border-dashed border-gray-600 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {isConnected ? (
                    <div className="text-center text-white">
                      <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Monitor className="h-12 w-12 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-white">3D Robot Model</p>
                      <p className="text-xs text-gray-400">
                        {ROBOTS.find(r => r.id === selectedRobot)?.name}
                      </p>
                      {isTracking && (
                        <div className="mt-2">
                          <Badge className="bg-green-500 animate-pulse">
                            <Activity className="h-3 w-3 mr-1" />
                            Tracking Active
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <Monitor className="h-16 w-16 mx-auto mb-2 opacity-30" />
                      <p className="text-gray-400">Connect robot to view 3D model</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={connectToRobot}
                  disabled={isConnected}
                  variant={isConnected ? "outline" : "default"}
                >
                  <Power className="h-4 w-4 mr-2" />
                  {isConnected ? "Connected" : "Connect"}
                </Button>
                
                <Button 
                  onClick={isTracking ? stopTracking : startTracking}
                  disabled={!isCameraActive}
                  variant={isTracking ? "destructive" : "default"}
                  className={isTracking ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  {isTracking ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Stop Tracking
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {!isCameraActive ? "Start Camera" : 
                       wsConnected ? "Tracking Active" : "Connecting..."}
                    </>
                  )}
                </Button>
              </div>

              {/* Debug button for troubleshooting */}
              <Button 
                onClick={debugCurrentState}
                variant="outline"
                size="sm"
                className="w-full text-xs text-gray-400 border-gray-600 hover:border-orange-500 hover:text-orange-500"
              >
                <Settings className="h-3 w-3 mr-1" />
                Debug State
              </Button>
            </div>
          </Card>

          {/* Camera Feed Panel */}
          <Card className="bg-gray-800 border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Camera className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">Camera Feed</h2>
              <Badge variant={isCameraActive ? "default" : "secondary"} className="ml-auto">
                {isCameraActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={startCamera}
                    disabled={isCameraActive}
                    size="sm"
                    className="flex-1"
                  >
                    {isCameraActive ? (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Camera Active
                      </>
                    ) : (
                      <>
                        <CameraOff className="h-4 w-4 mr-2" />
                        Start Camera
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={stopCamera}
                    disabled={!isCameraActive}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Stop
                  </Button>
                </div>
                
                {/* Raw Camera Feed */}
                <div>
                  <h3 className="text-sm font-medium mb-2 text-white">Raw Camera Feed</h3>
                  <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ display: isCameraActive ? 'block' : 'none' }}
                    />
                    {/* Hidden canvas for frame capture */}
                    <canvas
                      ref={canvasRef}
                      style={{ display: 'none' }}
                    />
                    {!isCameraActive && (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <CameraOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-gray-400">Raw camera feed will appear here</p>
                          <p className="text-sm text-gray-400">Grant camera access to start</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Processed Feed with Hand Tracking */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-medium text-white">Hand Tracking Feed</h3>
                    </div>
                    {isCameraActive && (
                      <Badge 
                        variant={wsConnected ? "default" : (handTrackingApiRef.current?.useRestApi ? "secondary" : "destructive")} 
                        className="text-xs"
                      >
                        {wsConnected ? "🟢 WebSocket" : 
                         handTrackingApiRef.current?.useRestApi ? "🟡 REST API" : 
                         "🔴 Disconnected"}
                      </Badge>
                    )}
                  </div>
                  <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video relative">
                    {isCameraActive ? (
                      <>
                        {wsConnected && isTracking ? (
                          <>
                            <canvas
                              ref={overlayCanvasRef}
                              className="w-full h-full object-cover"
                            />
                            {/* Status icons overlay - top left */}
                            {isCameraActive && wsConnected && (
                              <div className="absolute top-3 left-3 flex items-center gap-3">
                                {/* Hand detection status - hand icon */}
                                <div 
                                  className={`w-12 h-12 flex items-center justify-center transition-all duration-200 ${
                                    handVisible ? 'text-emerald-500' : 'text-gray-500'
                                  }`}
                                  title={handVisible ? "Hand detected" : "No hand detected"}
                                >
                                  <svg 
                                    viewBox="0 0 24 24" 
                                    className="w-8 h-8 fill-current"
                                  >
                                    <path d="M9,2C8.45,2 8,2.45 8,3V12C8,12.55 8.45,13 9,13C9.55,13 10,12.55 10,12V3C10,2.45 9.55,2 9,2M12,4C11.45,4 11,4.45 11,5V12C11,12.55 11.45,13 12,13C12.55,13 13,12.55 13,12V5C13,4.45 12.55,4 12,4M15,6C14.45,6 14,6.45 14,7V12C14,12.55 14.45,13 15,13C15.55,13 16,12.55 16,12V7C16,6.45 15.55,6 15,6M18,8C17.45,8 17,8.45 17,9V12C17,12.55 17.45,13 18,13C18.55,13 19,12.55 19,12V9C19,8.45 18.55,8 18,8M5,10C4.45,10 4,10.45 4,11V13C4,16.31 6.69,19 10,19H16C17.1,19 18,18.1 18,17V15H19C19.55,15 20,14.55 20,14V11C20,10.45 19.55,10 19,10H5Z"/>
                                  </svg>
                                </div>
                                {/* Gripper status - lock icon (only show when hand is detected) */}
                                {handVisible && (
                                  <div 
                                    className={`w-12 h-12 flex items-center justify-center transition-all duration-200 ${
                                      gripperClosed ? 'text-orange-400' : 'text-emerald-500'
                                    }`}
                                    title={gripperClosed ? "Gripper closed" : "Gripper open"}
                                  >
                                    <svg 
                                      viewBox="0 0 24 24" 
                                      className="w-8 h-8 fill-current"
                                    >
                                      {gripperClosed ? (
                                        // Closed lock icon
                                        <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                                      ) : (
                                        // Open lock icon
                                        <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18Z"/>
                                      )}
                                    </svg>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : wsConnected && isTracking ? (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                              <p className="text-green-400">Hand tracking active...</p>
                              <p className="text-sm text-gray-400">Waiting for hand detection</p>
                            </div>
                          </div>
                        ) : wsConnected && !isTracking ? (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <Hand className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                              <p className="text-blue-400">Starting tracking...</p>
                              <p className="text-sm text-gray-400">Initializing hand detection</p>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                            <div className="text-center text-white">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                              <p className="text-sm">Connecting to backend...</p>
                              <p className="text-xs text-gray-400 mt-1">
                                Establishing WebSocket connection
                              </p>
                              {wsError && (
                                <div className="mt-3 p-2 bg-red-900/20 rounded text-xs text-red-400 max-w-xs">
                                  <p className="font-medium">Connection Failed</p>
                                  <p>{wsError}</p>
                                  <p className="text-gray-400 mt-1">Check Analytics panel for details</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-gray-400">Start camera to connect to backend</p>
                          <p className="text-sm text-gray-400">WebSocket will connect automatically</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </Card>
        </div>

        {/* Analytics Panel */}
        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">Analytics & Debug Info</h2>
            </div>
            {showAnalytics ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {showAnalytics && (
            <div className="px-6 pb-6 border-t border-gray-700">
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Hand Tracking Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  >
                    {HAND_MODELS.map(model => (
                      <option key={model.id} value={model.id} className="bg-gray-800 text-white">
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Server Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Backend Server</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setUseOnlineServer(false)}
                      className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                        !useOnlineServer 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Local (localhost:8000)
                    </button>
                    <button
                      onClick={() => setUseOnlineServer(true)}
                      className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                        useOnlineServer 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Online (Render)
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">
                      Current: {useOnlineServer ? 'Online Server' : 'Local Server'}
                    </p>
                    <Badge 
                      variant={
                        apiStatus === 'connected' ? 'default' : 
                        apiStatus === 'cors' ? 'destructive' : 
                        apiStatus === 'checking' ? 'secondary' : 
                        'destructive'
                      } 
                      className="text-xs"
                    >
                      {apiStatus === 'connected' ? '🟢 Connected' : 
                       apiStatus === 'cors' ? '🚫 CORS' : 
                       apiStatus === 'checking' ? '🔄 Checking' : 
                       apiStatus === 'timeout' ? '⏰ Timeout' : 
                       '🔴 Error'}
                    </Badge>
                  </div>
                  {apiStatus === 'cors' && (
                    <div className="mt-2 p-2 bg-orange-900/50 border border-orange-600/50 rounded text-xs text-orange-200">
                      <p className="font-medium">CORS Issue Detected</p>
                      <p>Development server not allowed by backend.</p>
                      <p className="mt-1">
                        💡 <strong>Solutions:</strong>
                      </p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Deploy frontend to production</li>
                        <li>Run backend locally on port 8000</li>
                        <li>WebSocket may still work despite CORS error</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Fingertip Data */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2 text-white">
                    <Hand className="h-4 w-4" />
                    Hand Tracking
                  </h3>
                  <div className="text-xs font-mono text-gray-300 space-y-1">
                    {trackingResult?.fingertip_coords ? (
                      <>
                        <div className="text-gray-300">Hand: {handVisible ? 'Visible' : 'Not visible'}</div>
                        <div className="text-gray-300">Gripper: {gripperClosed ? 'Closed 🤏' : 'Open 🖐️'}</div>
                        <div className="text-gray-300">Points detected: {Object.keys(trackingResult.fingertip_coords).length}</div>
                      </>
                    ) : (
                      <div className="text-gray-300">No hand detected</div>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2 text-white">
                    <Zap className="h-4 w-4" />
                    Performance
                  </h3>
                  <div className="text-xs font-mono text-gray-300 space-y-1">
                    {trackingResult?.processing_time_ms ? (
                      <div className="text-gray-300">
                        Processing: {trackingResult.processing_time_ms.toFixed(1)}ms
                      </div>
                    ) : (
                      <div className="text-gray-400">Processing: --</div>
                    )}
                    {trackingResult?.latency_ms ? (
                      <div className="text-gray-300">
                        Latency: {trackingResult.latency_ms.toFixed(1)}ms
                      </div>
                    ) : (
                      <div className="text-gray-400">Latency: --</div>
                    )}
                    {trackingResult && (
                      <div className="text-gray-300">
                        Total: {((trackingResult.processing_time_ms || 0) + (trackingResult.latency_ms || 0)).toFixed(1)}ms
                      </div>
                    )}
                  </div>
                </div>

                {/* WebSocket Status */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2 text-white">
                    <Activity className="h-4 w-4" />
                    WebSocket Status
                  </h3>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div className={`font-medium ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
                      {isTracking ? (wsConnected ? '🟢 Connected' : '🔴 Disconnected') : '⚪ Not started'}
                    </div>
                    <div className="text-gray-300">
                      URL: {API_BASE.replace('https:', 'wss:')}/api/tracking/live
                    </div>
                    {wsError && (
                      <div className="text-red-400 bg-red-900/20 p-2 rounded text-xs">
                        Error: {wsError}
                      </div>
                    )}
                    {isTracking && !wsConnected && (
                      <div className="text-yellow-400 text-xs">
                        Tip: Check if backend is running and WebSocket endpoint is available
                      </div>
                    )}
                    <div className="mt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // Test overlay with fake data
                          const testData: BackendTrackingResult = {
                            success: true,
                            timestamp: new Date().toISOString(),
                            hand_detected: true,
                            processing_time_ms: 15.5,
                            message: "Test data",
                            fingertip_coords: {
                              thumb_tip: { x: 200, y: 200, z: 0.5 },
                              index_tip: { x: 250, y: 180, z: 0.3 },
                              index_pip: { x: 240, y: 220, z: 0.4 },
                              index_mcp: { x: 180, y: 250, z: 0.6 }
                            },
                            hand_pose: {
                              score: 0.95,
                              landmarks: []
                            },
                            robot_joints: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6]
                          };
                          setTrackingResult(testData);
                          setHandVisible(true);
                          setGripperClosed(Math.random() > 0.5);
                          addToConsole('🧪 Test overlay data applied');
                          setTimeout(() => {
                            setTrackingResult(null);
                            setHandVisible(false);
                            setGripperClosed(false);
                            addToConsole('🧪 Test overlay cleared');
                          }, 3000);
                        }}
                        className="text-gray-300 border-gray-600 hover:border-orange-500 hover:text-orange-500"
                      >
                        Test Overlay
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Robot Joint Positions */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2 text-white">
                    <Settings className="h-4 w-4" />
                    Robot Joints
                  </h3>
                  <div className="text-xs font-mono text-gray-300 space-y-1">
                    {robotState.jointAngles.map((angle, i) => (
                      <div key={i} className="text-gray-300">J{i + 1}: {angle.toFixed(3)} rad</div>
                    ))}
                  </div>
                </div>

                {/* API Status */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2 text-white">
                    <Zap className="h-4 w-4" />
                    HTTP API Status
                  </h3>
                  <div className={`text-sm font-medium mb-2 ${
                    apiStatus === "connected" ? "text-green-400" : 
                    apiStatus === "error" ? "text-yellow-400" : "text-yellow-400"
                  }`}>
                    {apiStatus === "connected" ? "✅ Connected" :
                     apiStatus === "error" ? "⚠️ Health check failed" : "⏳ Checking..."}
                  </div>
                  {apiStatus === "error" && (
                    <div className="text-xs text-gray-400 mb-2">
                      Note: WebSocket connection is what matters for hand tracking
                    </div>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => window.open(`${API_BASE}/docs`, '_blank')}
                    className="text-gray-300 border-gray-600 hover:border-orange-500 hover:text-orange-500"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    API Docs
                  </Button>
                </div>

                {/* WebSocket Status */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2 text-white">
                    <Activity className="h-4 w-4" />
                    WebSocket Status
                  </h3>
                  <div className={`text-sm font-medium mb-2 ${
                    wsConnected ? "text-green-400" : 
                    wsConnecting ? "text-yellow-400" : "text-red-400"
                  }`}>
                    {wsConnecting ? "🔄 Connecting..." :
                     wsConnected ? "✅ Connected" : "❌ Disconnected"}
                  </div>
                  {wsError && (
                    <div className="text-xs text-red-400 mb-2 font-mono bg-red-900/20 p-2 rounded">
                      {wsError}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mb-2">
                    Target: {WS_BASE}/api/tracking/live
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setupWebSocketConnection()}
                      disabled={wsConnected || wsConnecting}
                      className="text-gray-300 border-gray-600 hover:border-orange-500 hover:text-orange-500 disabled:opacity-50"
                    >
                      <Power className="h-3 w-3 mr-1" />
                      {wsConnecting ? 'Connecting...' : wsConnected ? 'Connected' : 'Retry'}
                    </Button>
                    {!isDevelopment && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => addToConsole('💡 To use local backend: npm run dev in backend folder, then refresh page')}
                        className="text-gray-300 border-gray-600 hover:border-blue-500 hover:text-blue-500"
                      >
                        Local Dev
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {/* Output Console */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium flex items-center gap-2 text-white">
                    <span className="inline-block"><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5-6h2a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2h2"></path></svg></span>
                    Output Console
                  </h3>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setConsoleLogs([])}
                    className="text-gray-300 border-gray-600 hover:border-orange-500 hover:text-orange-500"
                  >
                    Clear
                  </Button>
                </div>
                <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 h-32 overflow-y-auto">
                  {consoleLogs.length === 0 ? (
                    <div className="text-gray-400 text-xs">Console output will appear here...</div>
                  ) : (
                    <div className="text-xs font-mono space-y-1">
                      {consoleLogs.map((log, index) => (
                        <div key={index} className="text-gray-300">{log}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              variant="outline"
              onClick={() => window.open(`${API_BASE}`, '_blank')}
              className="text-gray-300 border-gray-600 hover:border-orange-500 hover:text-orange-500"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Full Demo
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('https://github.com/7jep7/human2robot', '_blank')}
              className="text-gray-300 border-gray-600 hover:border-orange-500 hover:text-orange-500"
            >
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
