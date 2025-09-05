// File deleted
import { useEffect, useRef, useState } from 'react';

// Remix-ready Hand Teleop Widget Component
// Client-side MediaPipe hand tracking for jonaspetersen.com integration

interface FingertipData {
  thumb: { x: number; y: number; z: number } | null;
  indexPip: { x: number; y: number; z: number } | null;
  indexTip: { x: number; y: number; z: number } | null;
}

interface RobotMapping {
  x: number;
  y: number;
  z: number;
  gripper: 'Open' | 'Closed';
}

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export default function HandTeleopWidget() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fingertips, setFingertips] = useState<FingertipData>({
    thumb: null,
    indexPip: null,
    indexTip: null
  });
  const [robotMapping, setRobotMapping] = useState<RobotMapping>({
    x: 0, y: 0, z: 0, gripper: 'Open'
  });
  const [fps, setFps] = useState(0);
  const [status, setStatus] = useState('Ready to start tracking');

  // MediaPipe refs
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Load MediaPipe scripts
  useEffect(() => {
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(true);
          return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const loadMediaPipe = async () => {
      try {
        await Promise.all([
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands'),
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils'),
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils')
        ]);
        console.log('✓ MediaPipe scripts loaded');
      } catch (error) {
        console.error('Failed to load MediaPipe:', error);
        setStatus('Failed to load MediaPipe dependencies');
      }
    };

    loadMediaPipe();
  }, []);

  const initializeMediaPipe = async () => {
    if (!window.Hands || !window.Camera) {
      throw new Error('MediaPipe not loaded');
    }

    // Initialize MediaPipe Hands
    handsRef.current = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    handsRef.current.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    handsRef.current.onResults(onResults);

    // Initialize camera
    if (videoRef.current) {
      cameraRef.current = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (isTracking && handsRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });
    }
  };

  const onResults = (results: any) => {
    if (!isTracking || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update canvas size
    canvas.width = videoRef.current?.videoWidth || 640;
    canvas.height = videoRef.current?.videoHeight || 480;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // Extract MVP fingertips (MediaPipe indices: 4=thumb, 6=indexPIP, 8=indexTip)
      const thumbTip = landmarks[4];
      const indexPip = landmarks[6];
      const indexTip = landmarks[8];
      
      // Convert to pixel coordinates
      const w = canvas.width;
      const h = canvas.height;
      
      const newFingertips = {
        thumb: { x: thumbTip.x * w, y: thumbTip.y * h, z: thumbTip.z },
        indexPip: { x: indexPip.x * w, y: indexPip.y * h, z: indexPip.z },
        indexTip: { x: indexTip.x * w, y: indexTip.y * h, z: indexTip.z }
      };
      
      setFingertips(newFingertips);
      drawFingertips(ctx, newFingertips);
      updateRobotMapping(newFingertips, w, h);
      
    } else {
      setFingertips({ thumb: null, indexPip: null, indexTip: null });
    }

    updateFPS();
  };

  const drawFingertips = (ctx: CanvasRenderingContext2D, data: FingertipData) => {
    if (!data.thumb || !data.indexPip || !data.indexTip) return;

    // Draw connection line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(data.indexPip.x, data.indexPip.y);
    ctx.lineTo(data.indexTip.x, data.indexTip.y);
    ctx.stroke();

    // Draw points
    drawPoint(ctx, data.thumb.x, data.thumb.y, '#FCD34D', 8); // Yellow - thumb
    drawPoint(ctx, data.indexPip.x, data.indexPip.y, '#3B82F6', 6); // Blue - PIP  
    drawPoint(ctx, data.indexTip.x, data.indexTip.y, '#EF4444', 8); // Red - tip

    // Draw labels
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('T', data.thumb.x - 6, data.thumb.y + 4);
    ctx.fillText('P', data.indexPip.x - 6, data.indexPip.y + 4);
    ctx.fillText('I', data.indexTip.x - 6, data.indexTip.y + 4);
  };

  const drawPoint = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number = 6) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const updateRobotMapping = (data: FingertipData, width: number, height: number) => {
    if (!data.thumb || !data.indexTip) return;

    // Simple mapping for robot control
    const x = ((data.indexTip.x / width) - 0.5) * 2; // -1 to 1
    const y = ((data.indexTip.y / height) - 0.5) * -2; // -1 to 1 (inverted Y)
    const z = Math.max(0, data.indexTip.z * 2); // 0 to 2

    // Gripper control based on thumb-index distance
    const distance = Math.sqrt(
      Math.pow(data.thumb.x - data.indexTip.x, 2) + 
      Math.pow(data.thumb.y - data.indexTip.y, 2)
    );
    const gripper = distance < 50 ? 'Closed' : 'Open';

    setRobotMapping({ x, y, z, gripper });
  };

  const updateFPS = () => {
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastTimeRef.current >= 1000) {
      const newFps = Math.round(frameCountRef.current * 1000 / (now - lastTimeRef.current));
      setFps(newFps);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  };

  const toggleTracking = async () => {
    if (isTracking) {
      stopTracking();
    } else {
      await startTracking();
    }
  };

  const startTracking = async () => {
    setIsLoading(true);
    setStatus('Initializing hand tracking...');

    try {
      await initializeMediaPipe();
      await cameraRef.current?.start();
      
      setIsTracking(true);
      setStatus('Hand tracking active');
      frameCountRef.current = 0;
      lastTimeRef.current = performance.now();
      
    } catch (error) {
      console.error('Failed to start tracking:', error);
      setStatus('Failed to start camera or MediaPipe');
    } finally {
      setIsLoading(false);
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    cameraRef.current?.stop();
    
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    setFingertips({ thumb: null, indexPip: null, indexTip: null });
    setRobotMapping({ x: 0, y: 0, z: 0, gripper: 'Open' });
    setFps(0);
    setStatus('Tracking stopped');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hand Teleop System</h2>
        <p className="text-gray-600">Real-time fingertip tracking for robot control</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Camera Feed */}
        <div className="space-y-4">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-64"
            />
          </div>

          <button
            onClick={toggleTracking}
            disabled={isLoading}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
              isTracking
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Initializing...' : isTracking ? '⏹️ Stop Tracking' : '📹 Start Tracking'}
          </button>

          <div className={`text-center p-3 rounded-lg text-sm ${
            isTracking ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {status} {isTracking && `• ${fps} FPS`}
          </div>
        </div>

        {/* Results & Robot Control */}
        <div className="space-y-4">
          {/* Fingertip Coordinates */}
          {isTracking && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Live Fingertips:</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-yellow-100 p-2 rounded">
                  <div className="font-medium text-yellow-800">Thumb Tip</div>
                  <div className="text-yellow-600">
                    {fingertips.thumb ? 
                      `(${Math.round(fingertips.thumb.x)}, ${Math.round(fingertips.thumb.y)})` : 
                      'Not detected'
                    }
                  </div>
                </div>
                <div className="bg-blue-100 p-2 rounded">
                  <div className="font-medium text-blue-800">Index PIP</div>
                  <div className="text-blue-600">
                    {fingertips.indexPip ? 
                      `(${Math.round(fingertips.indexPip.x)}, ${Math.round(fingertips.indexPip.y)})` : 
                      'Not detected'
                    }
                  </div>
                </div>
                <div className="bg-red-100 p-2 rounded">
                  <div className="font-medium text-red-800">Index Tip</div>
                  <div className="text-red-600">
                    {fingertips.indexTip ? 
                      `(${Math.round(fingertips.indexTip.x)}, ${Math.round(fingertips.indexTip.y)})` : 
                      'Not detected'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Robot Control Mapping */}
          {isTracking && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3">Robot Control Mapping:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-blue-700">X Position: <span className="font-mono">{robotMapping.x.toFixed(2)}</span></div>
                <div className="text-blue-700">Y Position: <span className="font-mono">{robotMapping.y.toFixed(2)}</span></div>
                <div className="text-blue-700">Z Position: <span className="font-mono">{robotMapping.z.toFixed(2)}</span></div>
                <div className="text-blue-700">Gripper: <span className="font-mono">{robotMapping.gripper}</span></div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">How to use:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Real-time fingertip detection with MediaPipe</li>
              <li>• Position your <strong>RIGHT hand</strong> in view</li>
              <li>• Three key points: Thumb tip, Index PIP, Index tip</li>
              <li>• Pinch thumb + index to control gripper</li>
            </ul>
            
            <h4 className="font-semibold text-blue-800 mt-4 mb-2">Visual indicators:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>Yellow = Thumb tip</li>
              <li>• <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>Blue = Index PIP joint</li>
              <li>• <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>Red = Index fingertip</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
