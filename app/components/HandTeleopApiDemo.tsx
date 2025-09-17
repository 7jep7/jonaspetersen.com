import { useState, useEffect } from 'react';
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

// API Configuration for production
const API_BASE_URL = 'https://hand-teleop-api.onrender.com';

interface RobotData {
  success: boolean;
  timestamp: string;
  hand_detected: boolean;
  fingertips: {
    thumb?: { x: number; y: number; z: number };
    index_pip?: { x: number; y: number; z: number };
    index_tip?: { x: number; y: number; z: number };
  };
  robot_control: {
    joint_angles: number[];
    end_effector_pose: {
      position: { x: number; y: number; z: number };
      orientation: { roll: number; pitch: number; yaw: number };
    };
    gripper_state: string;
    in_workspace: boolean;
    confidence: number;
  };
  robot_type: string;
  processing_time_ms: number;
}

interface Robot {
  id: string;
  name: string;
  dof: number;
  description?: string;
  workspace?: string;
}

interface ApiHealth {
  status: string;
  timestamp: string;
  version: string;
  service?: string;
  message?: string;
  dependencies?: {
    opencv: string;
    numpy: string;
    fastapi: string;
    mediapipe: string;
  };
}

export function HandTeleopApiDemo() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [selectedRobot, setSelectedRobot] = useState('so101');
  const [robotData, setRobotData] = useState<RobotData | null>(null);
  const [apiHealth, setApiHealth] = useState<ApiHealth | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
    fetchAvailableRobots();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      if (response.ok) {
        const health = await response.json();
        setApiHealth(health);
        setIsConnected(true);
        return;
      }
    } catch (error) {
      console.error('Health endpoint failed:', error);
      setIsConnected(false);
    }
  };

  const fetchAvailableRobots = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/robots`);
      if (response.ok) {
        const data = await response.json();
        setRobots(data.robots || []);
        if (data.current_robot) {
          setSelectedRobot(data.current_robot);
        }
      }
    } catch (error) {
      console.error('Failed to fetch robots:', error);
      // Fallback robot list
      setRobots([
        { id: 'so101', name: 'SO-101 Humanoid Hand', dof: 5 },
        { id: 'so100', name: 'SO-100 Industrial Gripper', dof: 2 },
        { id: 'koch', name: 'Koch Robotic Arm', dof: 7 },
        { id: 'moss', name: 'MOSS Research Platform', dof: 6 }
      ]);
    }
  };

  const configureRobot = async (robotId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/config/robot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ robot_type: robotId }),
      });
      
      if (response.ok) {
        setSelectedRobot(robotId);
        console.log(`Robot configured: ${robotId}`);
      }
    } catch (error) {
      console.error('Failed to configure robot:', error);
    }
  };

  const testApiTracking = async () => {
    setIsLoading(true);
    try {
      // Use the actual available endpoint
      const response = await fetch(`${API_BASE_URL}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_data: 'test_image_data',
          robot_type: selectedRobot
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRobotData(data);
        console.log('✅ API tracking test successful:', data);
      } else {
        console.error('❌ API tracking test failed');
      }
    } catch (error) {
      console.error('❌ API tracking error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = () => {
    try {
      const runningOnLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const websocketUrl = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');

      if (!runningOnLocalhost && websocketUrl.includes('localhost')) {
        console.warn('WebSocket connect suppressed: not running on localhost and websocket target points to localhost');
        return;
      }

      const sanitizedUrl = (!runningOnLocalhost && websocketUrl.includes('localhost')) ? 'wss://hand-teleop-api.onrender.com' : websocketUrl;
      if (sanitizedUrl !== websocketUrl) console.log(`Sanitized WebSocket URL to ${sanitizedUrl}`);

      const newWs = new WebSocket(`${sanitizedUrl}/api/tracking/live`);
      
      newWs.onopen = () => {
        console.log('🔗 WebSocket connected');
        setWs(newWs);
      };
      
      newWs.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'tracking_result') {
            setRobotData(message.data);
          }
          console.log('📨 WebSocket message:', message);
        } catch (error) {
          console.error('❌ WebSocket message error:', error);
        }
      };
      
      newWs.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setWs(null);
      };
      
      newWs.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
    }
  };

  const disconnectWebSocket = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }
  };

  return (
    <Card className="p-6 mt-8">
      <h3 className="text-xl font-semibold mb-4">🔗 Live API Integration</h3>
      
      {/* API Status */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-medium">
            API Status: {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        {apiHealth && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <strong>Service:</strong> {apiHealth.service || apiHealth.message}<br/>
            <strong>Status:</strong> {apiHealth.status}<br/>
            <strong>API URL:</strong> <a href={`${API_BASE_URL}/docs`} target="_blank" className="text-blue-600 underline">{API_BASE_URL}</a>
          </div>
        )}
      </div>

      {/* Robot Configuration */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Robot Type:</label>
        <div className="flex flex-wrap gap-2">
          {robots.map((robot) => (
            <Button
              key={robot.id}
              variant={selectedRobot === robot.id ? "default" : "outline"}
              size="sm"
              onClick={() => configureRobot(robot.id)}
            >
              {robot.name} ({robot.dof} DOF)
            </Button>
          ))}
        </div>
      </div>

      {/* API Test Controls */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={testApiTracking} disabled={isLoading || !isConnected}>
            {isLoading ? '⏳ Testing...' : '🧪 Test API Tracking'}
          </Button>
          
          <Button onClick={checkApiHealth} variant="outline">
            🔄 Refresh Status
          </Button>
          
          {!ws ? (
            <Button onClick={connectWebSocket} variant="outline" disabled={!isConnected}>
              🔗 Connect WebSocket
            </Button>
          ) : (
            <Button onClick={disconnectWebSocket} variant="outline">
              🔌 Disconnect WebSocket
            </Button>
          )}
        </div>
        
        {ws && (
          <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
            ✅ WebSocket connected for real-time updates
          </div>
        )}
      </div>

      {/* Live Robot Data */}
      {robotData && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold mb-3">🤖 Live Robot Data</h4>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {/* Hand Detection */}
            <div>
              <h5 className="font-medium mb-2">Hand Detection:</h5>
              <div className="space-y-1">
                <div>Status: {robotData.hand_detected ? '✅ Detected' : '❌ Not detected'}</div>
                <div>Confidence: {(robotData.robot_control.confidence * 100).toFixed(1)}%</div>
                <div>Processing: {robotData.processing_time_ms.toFixed(1)}ms</div>
              </div>
            </div>

            {/* Robot Control */}
            <div>
              <h5 className="font-medium mb-2">Robot Control:</h5>
              <div className="space-y-1">
                <div>Robot: {robotData.robot_type}</div>
                <div>Workspace: {robotData.robot_control.in_workspace ? '✅ In bounds' : '⚠️ Out of bounds'}</div>
                <div>Gripper: {robotData.robot_control.gripper_state}</div>
              </div>
            </div>

            {/* Joint Angles */}
            <div>
              <h5 className="font-medium mb-2">Joint Angles:</h5>
              <div className="font-mono text-xs">
                {robotData.robot_control.joint_angles.map((angle, i) => (
                  <div key={i}>J{i+1}: {angle.toFixed(1)}°</div>
                ))}
              </div>
            </div>

            {/* End Effector */}
            <div>
              <h5 className="font-medium mb-2">End Effector:</h5>
              <div className="space-y-1">
                <div>X: {robotData.robot_control.end_effector_pose.position.x.toFixed(3)}</div>
                <div>Y: {robotData.robot_control.end_effector_pose.position.y.toFixed(3)}</div>
                <div>Z: {robotData.robot_control.end_effector_pose.position.z.toFixed(3)}</div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Last update: {new Date(robotData.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* API Documentation Link */}
      <div className="mt-6 text-center">
        <Button asChild variant="outline">
          <a href={`${API_BASE_URL}/docs`} target="_blank" rel="noopener noreferrer">
            📖 View API Documentation
          </a>
        </Button>
      </div>
    </Card>
  );
}
