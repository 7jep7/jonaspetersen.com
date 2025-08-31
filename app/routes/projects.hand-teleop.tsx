import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useState, useEffect, useRef } from "react";
// HandTrackingAPI for websocket integration
interface HandTrackingResult {
  fingertip_coords?: {
    thumb?: { x: number; y: number };
    index_tip?: { x: number; y: number };
    index_pip?: { x: number; y: number };
    base_joint?: { x: number; y: number };
  };
}

class HandTrackingAPI {
  apiUrl: string;
  ws: WebSocket | null;
  onTrackingResult: ((result: HandTrackingResult) => void) | null;
  onConnectionChange: ((connected: boolean) => void) | null;
  onError: ((error: string) => void) | null;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl.replace('https:', 'wss:');
    this.ws = null;
    this.onTrackingResult = null;
    this.onConnectionChange = null;
    this.onError = null;
  }

  connect() {
    try {
      this.ws = new WebSocket(`${this.apiUrl}/api/tracking/live`);
      
      this.ws.onopen = () => {
        console.log('✅ Connected to hand tracking API');
        if (this.onConnectionChange) this.onConnectionChange(true);
      };
      
      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'tracking_result' && this.onTrackingResult) {
            this.onTrackingResult(data.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          if (this.onError) this.onError(`Error parsing message: ${error}`);
        }
      };
      
      this.ws.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
        if (this.onError) this.onError('WebSocket connection error');
      };
      
      this.ws.onclose = (event: CloseEvent) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        if (this.onConnectionChange) this.onConnectionChange(false);
        if (event.code !== 1000) { // Not a normal closure
          if (this.onError) this.onError(`Connection closed unexpectedly: ${event.reason || 'Unknown reason'}`);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      if (this.onError) this.onError(`Failed to create WebSocket: ${error}`);
    }
  }

  sendFrame(canvas: HTMLCanvasElement) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        this.ws.send(JSON.stringify({
          type: 'image',
          data: imageData,
          robot_type: 'so101',
          tracking_mode: 'mediapipe'
        }));
      } catch (error) {
        console.error('Error sending frame:', error);
        if (this.onError) this.onError(`Error sending frame: ${error}`);
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
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

const API_BASE = "https://hand-teleop-api.onrender.com";

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

  // Data state
  const [trackingResult, setTrackingResult] = useState<HandTrackingResult | null>(null);
  const [handVisible, setHandVisible] = useState(false);
  const [gripperClosed, setGripperClosed] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false); // Add test mode for overlay testing
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const handTrackingApiRef = useRef<HandTrackingAPI | null>(null);

  // Data state
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
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        const data = await response.json();
        setApiStatus('connected');
        addToConsole(`✅ Backend API connected: ${data.message || 'Health check passed'}`);
      } else {
        setApiStatus('error');
        addToConsole(`❌ Backend API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setApiStatus('error');
      addToConsole(`❌ Backend API connection failed: ${error}`);
      // Note: CORS errors are expected for some endpoints, WebSocket connection is what matters most
      console.warn('Health check failed, but WebSocket may still work:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      addToConsole('Camera started successfully');
      
      // Automatically start WebSocket connection when camera starts
      setupWebSocketConnection();
    } catch (error) {
      console.error("Camera access denied:", error);
      addToConsole('Camera access denied');
      alert("Camera access is required for hand tracking");
    }
  };

  const setupWebSocketConnection = () => {
    setWsError(null);
    addToConsole('Establishing WebSocket connection...');
    
    if (!handTrackingApiRef.current) {
      handTrackingApiRef.current = new HandTrackingAPI(API_BASE);
      
      handTrackingApiRef.current.onConnectionChange = (connected: boolean) => {
        setWsConnected(connected);
        if (connected) {
          addToConsole('✅ WebSocket connected successfully - Starting hand tracking automatically');
          setWsError(null);
          // Automatically start tracking when WebSocket connects
          setIsTracking(true);
          sendFramesLoop();
        } else {
          addToConsole('❌ WebSocket disconnected');
          setIsTracking(false);
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
        }
      };
      
      handTrackingApiRef.current.onError = (error: string) => {
        setWsError(error);
        addToConsole(`❌ WebSocket error: ${error}`);
      };
      
      handTrackingApiRef.current.onTrackingResult = (result: HandTrackingResult) => {
        console.log('Received tracking result:', result); // Debug log
        setTrackingResult(result);
        setHandVisible(!!result?.fingertip_coords);
        addToConsole(`📍 Tracking data received: ${result?.fingertip_coords ? 'Hand detected' : 'No hand'}`);
        
        // Gripper closed if thumb and index tip are close
        if (result?.fingertip_coords) {
          const thumb = result.fingertip_coords.thumb;
          const indexTip = result.fingertip_coords.index_tip;
          if (thumb && indexTip) {
            const dist = Math.sqrt(
              Math.pow(thumb.x - indexTip.x, 2) +
              Math.pow(thumb.y - indexTip.y, 2)
            );
            setGripperClosed(dist < 30); // threshold px
            addToConsole(`🤏 Gripper state: ${dist < 30 ? 'Closed' : 'Open'} (distance: ${dist.toFixed(1)}px)`);
          } else {
            setGripperClosed(false);
          }
        } else {
          setGripperClosed(false);
        }
      };
      
      handTrackingApiRef.current.connect();
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
      addToConsole(`Connecting to robot: ${selectedRobot}`);
      const response = await fetch(`${API_BASE}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robot_type: selectedRobot })
      });
      
      if (response.ok) {
        setIsConnected(true);
        addToConsole('Robot connected successfully');
      } else {
        addToConsole('Failed to connect to robot');
        alert("Failed to connect to robot");
      }
    } catch (error) {
      addToConsole('Connection error');
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
      addToConsole('WebSocket not connected. Tracking will start automatically when connected.');
      return;
    }
    
    setIsTracking(true);
    addToConsole('📹 Manual hand tracking started - sending video frames to backend');
    
    // Start sending frames
    sendFramesLoop();
  };

  const stopTracking = () => {
    setIsTracking(false);
    setWsConnected(false);
    setWsError(null);
    addToConsole('Hand tracking stopped');
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (handTrackingApiRef.current) {
      handTrackingApiRef.current.disconnect();
      handTrackingApiRef.current = null;
    }
  };

  // Send frames to backend via websocket
  const sendFramesLoop = () => {
    if (!isTracking || !videoRef.current || !canvasRef.current || !handTrackingApiRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Send frame to backend
    handTrackingApiRef.current.sendFrame(canvas);
    
    // Debug log every 30 frames (roughly once per second at 30fps)
    if (animationRef.current && animationRef.current % 30 === 0) {
      addToConsole(`📹 Sending video frame ${Math.floor(animationRef.current / 30)} to backend`);
    }
    
    animationRef.current = requestAnimationFrame(sendFramesLoop);
  };

  // Draw overlay points on second canvas
  useEffect(() => {
    if (!overlayCanvasRef.current || !videoRef.current || !isCameraActive) return;
    
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const drawFrame = () => {
      if (!isCameraActive || !video || !ctx) return;
      
      // Always draw the video frame first
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Debug: Log canvas state occasionally
      if (Math.random() < 0.01) { // Log 1% of frames
        console.log('Drawing overlay frame:', {
          canvasSize: `${canvas.width}x${canvas.height}`,
          isCameraActive,
          isTracking,
          hasTrackingResult: !!trackingResult,
          videoReady: video.readyState >= 2
        });
      }
      
      // Draw tracking points if available
      if (trackingResult?.fingertip_coords) {
        const { thumb, index_tip, index_pip, base_joint } = trackingResult.fingertip_coords;
        
        // Draw tracking points - subtle orange circles
        ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.9)';
        ctx.lineWidth = 2;
        
        // Draw points with labels
        const points = [
          { coords: thumb, label: 'T', color: 'rgba(255, 100, 100, 0.8)' },
          { coords: index_tip, label: 'I', color: 'rgba(100, 255, 100, 0.8)' },
          { coords: index_pip, label: 'M', color: 'rgba(100, 100, 255, 0.8)' },
          { coords: base_joint, label: 'B', color: 'rgba(255, 255, 100, 0.8)' }
        ];
        
        points.forEach(point => {
          if (point.coords) {
            // Draw colored circle for each point
            ctx.fillStyle = point.color;
            ctx.strokeStyle = point.color;
            ctx.beginPath();
            ctx.arc(point.coords.x, point.coords.y, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // Draw subtle label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(point.label, point.coords.x, point.coords.y - 10);
          }
        });
      }
      
      // Draw status icons - subtle at bottom of video (always show when camera is active)
      const bottomY = canvas.height - 30; // Position near bottom
      ctx.textAlign = 'center';
      ctx.font = '20px sans-serif'; // Make icons bigger and more visible
      
      // Add subtle dark background for better visibility
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(canvas.width / 2 - 30, bottomY - 25, 60, 35);
      
      // Add white border for visibility
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(canvas.width / 2 - 30, bottomY - 25, 60, 35);
      
      if (isTracking && trackingResult?.fingertip_coords && handVisible) {
        // Hand detected - show gripper state
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        ctx.fillText(gripperClosed ? '🤏' : '✋', canvas.width / 2, bottomY);
      } else if (isTracking) {
        // Tracking active but no hand detected
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        ctx.fillText('🚫', canvas.width / 2, bottomY);
      } else {
        // Camera active but tracking not started
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('⏸️', canvas.width / 2, bottomY);
      }
      
      // Debug: Draw a test indicator in top-left to confirm overlay is working
      ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.fillRect(10, 10, 20, 20);
      ctx.fillStyle = 'white';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('OVERLAY', 35, 25);
      
      // Continue the animation loop when camera is active (always show icons)
      if (isCameraActive) {
        requestAnimationFrame(drawFrame);
      }
    };
    
    // Start the drawing loop when camera is active
    if (isCameraActive) {
      drawFrame();
    }
  }, [trackingResult, handVisible, gripperClosed, isTracking, isCameraActive]);

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
                  disabled={!isConnected || !isCameraActive}
                  variant={isTracking ? "outline" : "default"}
                >
                  {isTracking ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Stop Control
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {!isCameraActive ? "Start Camera First" : 
                       !wsConnected ? "Auto-tracking will begin" : 
                       "Manual Control"}
                    </>
                  )}
                </Button>
              </div>
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
                    <h3 className="text-sm font-medium text-white">Hand Tracking Feed</h3>
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
                          <canvas
                            ref={overlayCanvasRef}
                            className="w-full h-full object-cover"
                          />
                        ) : wsConnected && !isTracking ? (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                              <p className="text-green-400">Starting hand tracking...</p>
                              <p className="text-sm text-gray-400">Hand detection will begin momentarily</p>
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
                          const testData: HandTrackingResult = {
                            fingertip_coords: {
                              thumb: { x: 200, y: 200 },
                              index_tip: { x: 250, y: 180 },
                              index_pip: { x: 240, y: 220 },
                              base_joint: { x: 180, y: 250 }
                            }
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
