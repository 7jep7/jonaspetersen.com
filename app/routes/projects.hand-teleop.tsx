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
  }

  connect() {
    return new Promise<void>((resolve, reject) => {
      try {
        // Use the exact WebSocket endpoint from the backend guide
        const wsUrl = `${this.apiUrl}/api/tracking/live`;
        console.log('🔌 Attempting WebSocket connection to:', wsUrl);
        
        // Set up connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.error('❌ WebSocket connection timeout');
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
            
            if (response.type === 'pong') {
              console.log('🏓 Pong received - server is responsive');
            } else if (response.type === 'tracking_result' && this.onTrackingResult) {
              // Calculate round-trip latency
              const now = Date.now();
              const latency = now - this.lastFrameTime;
              this.frameQueue = Math.max(0, this.frameQueue - 1);
              
              // Add latency info to result
              const resultWithLatency = {
                ...response.data,
                latency_ms: latency,
                queue_depth: this.frameQueue
              };
              
              this.onTrackingResult(resultWithLatency);
              
              // Log performance metrics occasionally
              if (Math.random() < 0.1) { // 10% of results
                console.log(`📊 Latency: ${latency}ms, Queue: ${this.frameQueue}, Processing: ${response.data.processing_time_ms}ms`);
              }
            } else if (response.type === 'error') {
              console.error('❌ Backend error:', response.message);
              if (this.onError) this.onError(`Backend: ${response.message}`);
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
            if (this.onError) this.onError(`Parse error: ${error}`);
          }
        };
        
        this.ws.onerror = (error: Event) => {
          console.error('❌ WebSocket error:', error);
          clearTimeout(connectionTimeout);
          if (this.onError) this.onError('WebSocket connection failed');
          reject(new Error('WebSocket error'));
        };
        
        this.ws.onclose = (event: CloseEvent) => {
          console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason || 'Unknown reason'}`);
          clearTimeout(connectionTimeout);
          this.isConnected = false;
          if (this.onConnectionChange) this.onConnectionChange(false);
          
          // Auto-reconnect logic (but not on first failed connection)
          if (event.code !== 1000 && this.reconnectAttempts > 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = 2000 * this.reconnectAttempts;
            console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), delay);
          } else if (event.code !== 1000 && this.reconnectAttempts === 0) {
            // First connection failed
            reject(new Error(`Connection failed: ${event.code} ${event.reason}`));
          }
        };
      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        if (this.onError) this.onError(`Setup failed: ${error}`);
        reject(error);
      }
    });
  }

  sendFrame(canvas: HTMLCanvasElement, trackingMode: string = 'mediapipe', robotType: string = 'so101') {
    if (this.ws?.readyState === WebSocket.OPEN) {
      // Skip frame if queue is full (prevents overwhelming backend)
      if (this.frameQueue >= this.maxFrameQueue) {
        console.warn(`⚠️ Skipping frame - queue full (${this.frameQueue}/${this.maxFrameQueue})`);
        return false;
      }
      
      try {
        // Follow the exact format from the backend guide
        const imageData = canvas.toDataURL('image/jpeg', 0.7); // Slightly lower quality for performance
        
        const message = {
          type: 'image',
          data: imageData,
          tracking_mode: trackingMode,
          robot_type: robotType,
          timestamp: new Date().toISOString(),
          client_timestamp: Date.now() // For latency calculation
        };
        
        this.ws.send(JSON.stringify(message));
        this.lastFrameTime = Date.now();
        this.frameQueue++;
        return true;
      } catch (error) {
        console.error('Error sending frame:', error);
        if (this.onError) this.onError(`Error sending frame: ${error}`);
        return false;
      }
    } else {
      console.warn('WebSocket not connected, cannot send frame');
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
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
      this.isConnected = false;
    }
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

// Try local first in development, fallback to remote
const API_BASE = isDevelopment ? "http://localhost:8000" : "https://hand-teleop-api.onrender.com";
const WS_BASE = isDevelopment ? "ws://localhost:8000" : "wss://hand-teleop-api.onrender.com";

// Connection timeout settings
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

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
  // Output console state
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

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

  // Check API status on mount
  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      setApiStatus('checking');
      addToConsole('🔍 Checking backend API health...');
      
      // Add timeout for health check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
      
      const response = await fetch(`${API_BASE}/health`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
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
        addToConsole(`⏰ Backend API timeout (>${HEALTH_CHECK_TIMEOUT / 1000}s) - WebSocket may still work`);
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
          addToConsole('✅ WebSocket connected - hand tracking ready');
          setWsError(null);
        } else {
          addToConsole('❌ WebSocket disconnected');
          setIsTracking(false); // Stop tracking when WebSocket disconnects
        }
      };

      handTrackingApiRef.current.onError = (error: string) => {
        setWsError(error);
        setWsConnecting(false);
        addToConsole(`❌ WebSocket error: ${error}`);
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
    setProcessingTime(result.processing_time_ms);
    
    // Update console with tracking info including performance metrics
    if (result.hand_detected && result.fingertip_coords) {
      const fingertips = result.fingertip_coords;
      const performanceInfo = result.latency_ms ? 
        ` | Latency: ${result.latency_ms.toFixed(1)}ms` : '';
      addToConsole(`📍 Hand detected: thumb(${fingertips.thumb_tip.x.toFixed(3)}, ${fingertips.thumb_tip.y.toFixed(3)}) | Processing: ${result.processing_time_ms.toFixed(1)}ms${performanceInfo}`);
      
      // Calculate gripper state
      const pinchDistance = handTrackingApiRef.current?.calculatePinchDistance(fingertips) || 1;
      const isGripperClosed = pinchDistance < 0.05;
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

      // Note: Overlay drawing is now handled by the main animation loop
    } else {
      const performanceInfo = result.latency_ms ? 
        ` | Latency: ${result.latency_ms.toFixed(1)}ms` : '';
      addToConsole(`👻 No hand detected - ${result.message} | Processing: ${result.processing_time_ms.toFixed(1)}ms${performanceInfo}`);
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
      addToConsole('Please start camera first');
      alert("Please start camera first");
      return;
    }
    
    if (!wsConnected) {
      addToConsole('WebSocket not connected. Please wait for connection...');
      setupWebSocketConnection(); // Try to reconnect
      return;
    }
    
    setIsTracking(true);
    addToConsole('▶️ Starting hand tracking at 10 FPS');
    
    // The useEffect will handle starting the frame sending interval
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
      'Selected Robot': selectedRobot
    };
    
    addToConsole('🔍 Debug State:');
    Object.entries(debugInfo).forEach(([key, value]) => {
      addToConsole(`  ${key}: ${value}`);
    });
    
    console.log('Debug State:', debugInfo);
    
    // Try to send a test frame manually
    if (video && canvas && handTrackingApiRef.current && wsConnected) {
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
    }
  };

  // Send frames to backend via websocket - Rate limited to 10 FPS for optimal performance
  const sendFramesLoop = () => {
    // Debug: Check all conditions
    const debugInfo = {
      isTracking,
      hasVideo: !!videoRef.current,
      hasCanvas: !!canvasRef.current,
      hasApi: !!handTrackingApiRef.current,
      wsConnected,
      videoWidth: videoRef.current?.videoWidth || 0,
      videoHeight: videoRef.current?.videoHeight || 0,
      videoReady: videoRef.current?.readyState || 0
    };
    
    if (!isTracking) {
      console.log('❌ Frame send blocked: tracking not active');
      return;
    }
    
    if (!videoRef.current) {
      console.log('❌ Frame send blocked: no video element');
      return;
    }
    
    if (!canvasRef.current) {
      console.log('❌ Frame send blocked: no canvas element');
      return;
    }
    
    if (!handTrackingApiRef.current) {
      console.log('❌ Frame send blocked: no WebSocket API');
      return;
    }
    
    if (!wsConnected) {
      console.log('❌ Frame send blocked: WebSocket not connected');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.log('❌ Frame send blocked: no canvas context');
      return;
    }
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('❌ Frame send blocked: video not ready', { 
        width: video.videoWidth, 
        height: video.videoHeight,
        readyState: video.readyState 
      });
      return;
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
      if (now - lastFrameTimeRef.current > 3000) { // Log every 3 seconds
        addToConsole(`📹 ${success ? 'Sending' : 'Failed to send'} frames to backend (${selectedModel})`);
        lastFrameTimeRef.current = now;
      }
    } catch (error) {
      console.error('Error in sendFramesLoop:', error);
      addToConsole(`❌ Frame send error: ${error}`);
    }
  };

  // Start/stop frame sending with proper interval
  useEffect(() => {
    if (isTracking && wsConnected) {
      // Send frames at 10 FPS (100ms interval) for optimal performance
      frameIntervalRef.current = setInterval(sendFramesLoop, 100);
      addToConsole('▶️ Started sending frames at 10 FPS');
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
      ctx.fillStyle = isGripperClosed ? '#ff4444' : '#00ff00';
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
      ctx.fillStyle = isGripperClosed ? '#ff4444' : '#00ff00';
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
                  disabled={!isCameraActive || !wsConnected}
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
                      {!isCameraActive ? "Start Camera First" : 
                       !wsConnected ? "Connect WebSocket First" : 
                       "Start Tracking"}
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
                      <Badge variant={wsConnected ? "default" : "destructive"} className="text-xs">
                        {wsConnected ? "🟢 Connected" : "🔴 Disconnected"}
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
                              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                {/* Hand detection status - minimal circle indicator */}
                                <div 
                                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                    handVisible ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-gray-500'
                                  }`}
                                  title={handVisible ? "Hand detected" : "No hand detected"}
                                />
                                {/* Gripper status - minimal square indicator */}
                                <div 
                                  className={`w-2 h-2 transition-all duration-200 ${
                                    handVisible 
                                      ? (gripperClosed ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-gray-400') 
                                      : 'bg-gray-600'
                                  }`}
                                  style={{ borderRadius: '1px' }}
                                  title={
                                    handVisible 
                                      ? (gripperClosed ? "Gripper closed" : "Gripper open") 
                                      : "No hand detected"
                                  }
                                />
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
                              <p className="text-blue-400">Ready to track</p>
                              <p className="text-sm text-gray-400">Click "Start Tracking" to begin</p>
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
