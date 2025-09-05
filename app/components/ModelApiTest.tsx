// File deleted
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';

export interface TestResult {
  success: boolean;
  latency: number;
  error?: string;
  response?: any;
}

export interface ModelTestProps {
  apiEndpoint: string;
  apiKey?: string;
  onTestComplete?: (result: TestResult) => void;
}

export function ModelApiTest({ apiEndpoint, apiKey, onTestComplete }: ModelTestProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const startTime = Date.now();
      
      // Test 1: Health check
      const healthResponse = await fetch(`${apiEndpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': apiKey ? `Bearer ${apiKey}` : '',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
      }
      
      const healthData = await healthResponse.json();
      
      // Test 2: Simple game move request (Tic-Tac-Toe)
      const gameTestData = {
        game_id: 'tic-tac-toe',
        game_state: {
          board: [
            ['', '', ''],
            ['X', '', ''],
            ['', '', 'O']
          ],
          current_player: 'X',
          turn: 3
        },
        valid_moves: [
          { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
          { row: 1, col: 1 }, { row: 1, col: 2 },
          { row: 2, col: 0 }, { row: 2, col: 1 }
        ],
        time_limit_ms: 5000
      };
      
      const moveResponse = await fetch(`${apiEndpoint}/play`, {
        method: 'POST',
        headers: {
          'Authorization': apiKey ? `Bearer ${apiKey}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameTestData),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      if (!moveResponse.ok) {
        throw new Error(`Move request failed: ${moveResponse.status} ${moveResponse.statusText}`);
      }
      
      const moveData = await moveResponse.json();
      const latency = Date.now() - startTime;
      
      // Validate move response format
      if (!moveData.move || typeof moveData.move !== 'object') {
        throw new Error('Invalid move response format: missing or invalid move field');
      }
      
      if (!Number.isInteger(moveData.move.row) || !Number.isInteger(moveData.move.col)) {
        throw new Error('Invalid move format: row and col must be integers');
      }
      
      if (moveData.move.row < 0 || moveData.move.row > 2 || moveData.move.col < 0 || moveData.move.col > 2) {
        throw new Error('Invalid move: row and col must be between 0 and 2');
      }
      
      const testResult: TestResult = {
        success: true,
        latency,
        response: {
          health: healthData,
          move: moveData
        }
      };
      
      setResult(testResult);
      onTestComplete?.(testResult);
      
    } catch (error) {
      const testResult: TestResult = {
        success: false,
        latency: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
      setResult(testResult);
      onTestComplete?.(testResult);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="p-6 bg-gray-700 border-gray-600">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-white">API Connectivity Test</h3>
        <Button 
          onClick={runTest} 
          disabled={testing || !apiEndpoint}
          variant="outline"
          className="border-gray-500 text-gray-300 hover:border-orange-500 hover:text-orange-500"
        >
          {testing ? 'Testing...' : 'Run Test'}
        </Button>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Endpoint:</span>
          <span className="font-mono text-xs text-gray-300">{apiEndpoint || 'Not specified'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Authentication:</span>
          <Badge variant={apiKey ? 'default' : 'secondary'} 
                 className={apiKey ? 'bg-orange-500 text-white' : 'bg-gray-600 text-gray-300'}>
            {apiKey ? 'API Key Provided' : 'No Authentication'}
          </Badge>
        </div>
      </div>
      
      {result && (
        <div className="mt-6 p-4 border border-gray-600 rounded-lg bg-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant={result.success ? 'default' : 'destructive'} 
                   className={result.success ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
              {result.success ? '✅ Success' : '❌ Failed'}
            </Badge>
            {result.success && (
              <span className="text-sm text-gray-400">
                Response time: {result.latency}ms
              </span>
            )}
          </div>
          
          {result.error && (
            <div className="text-sm text-red-400 mb-3">
              <strong>Error:</strong> {result.error}
            </div>
          )}
          
          {result.success && result.response && (
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-1 text-white">Health Check Response:</h4>
                <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto text-gray-300">
                  {JSON.stringify(result.response.health, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm mb-1 text-white">Test Move Response:</h4>
                <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto text-gray-300">
                  {JSON.stringify(result.response.move, null, 2)}
                </pre>
              </div>
              
              <div className="bg-green-900/50 border border-green-600 rounded p-3">
                <p className="text-sm text-green-400">
                  ✅ Your model API is compatible with LBM Arena! 
                  You can proceed with the submission.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {testing && (
        <div className="mt-6 p-4 bg-gray-700 border border-gray-600 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Running API Tests...</p>
              <p className="text-xs text-gray-400">
                Testing health endpoint and basic game move functionality
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
