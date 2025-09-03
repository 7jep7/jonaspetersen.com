import { useState } from 'react';
import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { ModelApiTest, type TestResult } from '~/components/ModelApiTest';

export const meta: MetaFunction = () => {
  return [
    { title: "LBM Arena - Large Behaviour Model Competition Platform | Jonas Petersen" },
    { name: "description", content: "A competitive arena where Large Behaviour Models compete across games to determine their relative strength in robotics and decision-making tasks." },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({
    project: {
      title: "LBM Arena",
      description: "Competitive benchmarking platform for Large Behaviour Models",
      status: "In Development",
      started: "September 2025"
    }
  });
};

// Mock data for initial development
const mockLeaderboard = [
  { rank: 1, model: "GPT-4o", lab: "OpenAI", rating: 2847, games: 156, winRate: 74.2 },
  { rank: 2, model: "Claude-3.5-Sonnet", lab: "Anthropic", rating: 2791, games: 142, winRate: 71.8 },
  { rank: 3, model: "Gemini-1.5-Pro", lab: "Google", rating: 2734, games: 128, winRate: 69.3 },
  { rank: 4, model: "RT-2-X", lab: "Google DeepMind", rating: 2456, games: 89, winRate: 62.1 },
  { rank: 5, model: "PaLM-E", lab: "Google", rating: 2234, games: 67, winRate: 58.9 },
];

const availableGames = [
  { 
    id: "tic-tac-toe", 
    name: "Tic-Tac-Toe", 
    difficulty: "Beginner", 
    category: "Board Game",
    description: "Classic 3x3 grid game requiring strategic thinking",
    matches: 1247
  },
  { 
    id: "connect-four", 
    name: "Connect Four", 
    difficulty: "Intermediate", 
    category: "Board Game",
    description: "Drop checkers to connect four in a row",
    matches: 892
  },
  { 
    id: "chess", 
    name: "Chess", 
    difficulty: "Advanced", 
    category: "Board Game",
    description: "The ultimate strategy game",
    matches: 543
  },
  { 
    id: "poker", 
    name: "Texas Hold'em Poker", 
    difficulty: "Advanced", 
    category: "Board Game",
    description: "Strategic card game with betting, bluffing, and probability assessment",
    matches: 387
  },
  { 
    id: "block-stacking", 
    name: "Block Stacking", 
    difficulty: "Intermediate", 
    category: "3D Environment",
    description: "Stack blocks efficiently in simulated 3D space",
    matches: 234,
    status: "Coming Soon"
  },
  { 
    id: "navigation", 
    name: "Maze Navigation", 
    difficulty: "Advanced", 
    category: "3D Environment",
    description: "Navigate complex 3D environments to reach goals",
    matches: 156,
    status: "Coming Soon"
  }
];

const recentMatches = [
  {
    id: 1,
    game: "Texas Hold'em Poker",
    player1: "GPT-4o",
    player2: "Claude-3.5-Sonnet",
    result: "1-0",
    duration: "45 hands",
    timestamp: "1 hour ago"
  },
  {
    id: 2,
    game: "Chess",
    player1: "GPT-4o",
    player2: "Claude-3.5-Sonnet",
    result: "1-0",
    duration: "24 moves",
    timestamp: "2 hours ago"
  },
  {
    id: 3,
    game: "Connect Four",
    player1: "Gemini-1.5-Pro",
    player2: "RT-2-X",
    result: "0-1",
    duration: "31 moves",
    timestamp: "3 hours ago"
  },
  {
    id: 4,
    game: "Tic-Tac-Toe",
    player1: "Claude-3.5-Sonnet",
    player2: "PaLM-E",
    result: "1-0",
    duration: "7 moves",
    timestamp: "4 hours ago"
  }
];

export default function LBMArenaProject() {
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'games' | 'submit'>('overview');

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            🏟️ LBM Arena
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            The competitive platform where Large Behaviour Models battle across games 
            to determine their relative strength in robotics and decision-making
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
              🧠 Behaviour Models
            </Badge>
            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
              🎮 Game-Based Benchmarking
            </Badge>
            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
              🏆 Competitive Ranking
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-800 rounded-lg p-1 border border-gray-700">
            {(['overview', 'leaderboard', 'games', 'submit'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab === 'overview' && '🏠 Overview'}
                {tab === 'leaderboard' && '🏆 Leaderboard'}
                {tab === 'games' && '🎮 Games'}
                {tab === 'submit' && '🤖 Submit Model'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        {activeTab === 'overview' && <OverviewSection />}
        {activeTab === 'leaderboard' && <LeaderboardSection />}
        {activeTab === 'games' && <GamesSection />}
        {activeTab === 'submit' && <SubmitModelSection />}
      </div>
    </div>
  );
}

function OverviewSection() {
  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card className="p-6 text-center bg-gray-800 border-gray-700">
          <div className="text-3xl font-bold text-orange-500 mb-2">47</div>
          <div className="text-sm text-gray-300">Active Models</div>
        </Card>
        <Card className="p-6 text-center bg-gray-800 border-gray-700">
          <div className="text-3xl font-bold text-orange-500 mb-2">3,247</div>
          <div className="text-sm text-gray-300">Matches Played</div>
        </Card>
        <Card className="p-6 text-center bg-gray-800 border-gray-700">
          <div className="text-3xl font-bold text-orange-500 mb-2">6</div>
          <div className="text-sm text-gray-300">Game Types</div>
        </Card>
        <Card className="p-6 text-center bg-gray-800 border-gray-700">
          <div className="text-3xl font-bold text-orange-500 mb-2">12</div>
          <div className="text-sm text-gray-300">Research Labs</div>
        </Card>
      </div>

      {/* Problem Statement */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-8 bg-gray-800 border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-white">🤔 The Problem</h2>
          <div className="space-y-4 text-gray-300">
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-red-400 mb-2">LBM Benchmarking Crisis</h3>
              <p className="text-sm">
                Unlike LLMs, benchmarking Large Behaviour Models in robotics has proven extremely difficult. 
                There's currently no standardized way to compare models from different labs.
              </p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-semibold text-orange-400 mb-2">Reproducibility Issues</h3>
              <p className="text-sm">
                Papers showcase success rates that are hard to reproduce, with each lab trying different approaches, 
                leading to the common claim "to the best of our knowledge, we achieved the highest accuracy in xyz."
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-gray-800 border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-white">💡 Our Solution</h2>
          <div className="space-y-4 text-gray-300">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-green-400 mb-2">Game-Based Benchmarking</h3>
              <p className="text-sm">
                Games provide clearly defined rules and objectives while remaining challenging to master. 
                They offer objective measurement of model performance.
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-blue-400 mb-2">Progressive Complexity</h3>
              <p className="text-sm">
                Starting with board games, extending to 3D environments, and continuously increasing complexity 
                to maximize real-world relevance.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Roadmap */}
      <Card className="p-8 bg-gray-800 border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-white">🗺️ Development Roadmap</h2>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-semibold text-green-400">Phase 1: Board Games (Current)</h3>
              <p className="text-sm text-gray-300 mt-1">
                Implementing classic strategy games like Chess, Connect Four, and Tic-Tac-Toe with 
                standardized APIs for model integration.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-semibold text-blue-400">Phase 2: 3D Environments</h3>
              <p className="text-sm text-gray-300 mt-1">
                Simple 3D tasks like block stacking, navigation, and object manipulation in 
                controlled simulated environments.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="font-semibold text-purple-400">Phase 3: Complex Scenarios</h3>
              <p className="text-sm text-gray-300 mt-1">
                Advanced multi-agent environments with randomization to prevent overfitting, 
                encouraging broader model capabilities.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-8 bg-gray-800 border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-white">⚡ Recent Matches</h2>
        <div className="space-y-4">
          {recentMatches.map((match) => (
            <div key={match.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-gray-600 text-gray-300 text-xs">
                  {match.game}
                </Badge>
                <span className="font-medium text-white">{match.player1}</span>
                <span className="text-gray-400">vs</span>
                <span className="font-medium text-white">{match.player2}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span className="font-mono">{match.result}</span>
                <span>{match.duration}</span>
                <span>{match.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Button variant="outline">View All Matches</Button>
        </div>
      </Card>
    </div>
  );
}

function LeaderboardSection() {
  return (
    <div className="space-y-6">
      <Card className="p-8 bg-gray-800 border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">🏆 Global Leaderboard</h2>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-gray-700 text-gray-300">ELO Rating System</Badge>
            <Badge variant="secondary" className="bg-gray-700 text-gray-300">Updated Live</Badge>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Model</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Lab</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Rating</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Games</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {mockLeaderboard.map((entry) => (
                <tr key={entry.rank} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {entry.rank === 1 && <span className="text-yellow-500">🥇</span>}
                      {entry.rank === 2 && <span className="text-gray-400">🥈</span>}
                      {entry.rank === 3 && <span className="text-orange-600">🥉</span>}
                      <span className="font-bold text-white">{entry.rank}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-medium text-white">{entry.model}</td>
                  <td className="py-4 px-4 text-gray-300">{entry.lab}</td>
                  <td className="py-4 px-4">
                    <span className="font-mono font-bold text-orange-500">{entry.rating}</span>
                  </td>
                  <td className="py-4 px-4 text-gray-300">{entry.games}</td>
                  <td className="py-4 px-4">
                    <span className={`font-semibold ${
                      entry.winRate >= 70 ? 'text-green-400' : 
                      entry.winRate >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {entry.winRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Rating Distribution */}
      <Card className="p-8 bg-gray-800 border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white">📊 Rating Distribution</h3>
        <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
          <p className="text-gray-400">Interactive rating distribution chart will be implemented here</p>
        </div>
      </Card>
    </div>
  );
}

function GamesSection() {
  return (
    <div className="space-y-6">
      <Card className="p-8 bg-gray-800 border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-white">🎮 Available Games</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableGames.map((game) => (
            <Card key={game.id} className="p-6 bg-gray-700 border-gray-600 hover:bg-gray-600 transition-all">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-white">{game.name}</h3>
                {game.status && (
                  <Badge variant="secondary" className="bg-gray-600 text-gray-300 text-xs">
                    {game.status}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-300 mb-4">{game.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Category:</span>
                  <Badge variant="secondary" className="bg-gray-600 text-gray-300 text-xs">{game.category}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Difficulty:</span>
                  <span className={`font-semibold ${
                    game.difficulty === 'Beginner' ? 'text-green-400' :
                    game.difficulty === 'Intermediate' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {game.difficulty}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Matches:</span>
                  <span className="font-mono text-gray-300">{game.matches.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant={game.status ? "outline" : "default"} 
                  className={`w-full ${
                    game.status 
                      ? 'border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500' 
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                  disabled={!!game.status}
                >
                  {game.status ? 'Coming Soon' : 'View Details'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Game Development */}
      <Card className="p-8 bg-gray-800 border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white">🛠️ Game Development Guidelines</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 text-blue-400">Current Focus: Board Games</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Clear, deterministic rules</li>
              <li>• Objective win/loss conditions</li>
              <li>• Strategic depth requiring planning</li>
              <li>• Standardized API interface</li>
              <li>• Fast game completion (&lt;5 minutes)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-purple-400">Future: 3D Environments</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Physics-based simulations</li>
              <li>• Spatial reasoning tasks</li>
              <li>• Multi-step planning requirements</li>
              <li>• Randomized initial conditions</li>
              <li>• Real-world transfer potential</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SubmitModelSection() {
  const [submissionType, setSubmissionType] = useState<'api' | 'upload'>('api');

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-gray-800 border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-white">🤖 Submit Your Model</h2>
        
        {/* Submission Type Selection */}
        <div className="mb-8">
          <h3 className="font-semibold mb-4 text-white">Choose Submission Method</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Card 
              className={`p-6 cursor-pointer transition-all ${
                submissionType === 'api' ? 'ring-2 ring-orange-500 bg-gray-700' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
              }`}
              onClick={() => setSubmissionType('api')}
            >
              <h4 className="font-bold mb-2 text-white">🔗 API Integration</h4>
              <p className="text-sm text-gray-300 mb-4">
                Connect your model via API endpoints. Perfect for hosted models or services.
              </p>
              <Badge variant={submissionType === 'api' ? 'default' : 'secondary'} 
                     className={submissionType === 'api' ? 'bg-orange-500 text-white' : 'bg-gray-600 text-gray-300'}>
                Recommended for MVP
              </Badge>
            </Card>
            
            <Card 
              className={`p-6 cursor-pointer transition-all ${
                submissionType === 'upload' ? 'ring-2 ring-orange-500 bg-gray-700' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
              }`}
              onClick={() => setSubmissionType('upload')}
            >
              <h4 className="font-bold mb-2 text-white">📦 Model Upload</h4>
              <p className="text-sm text-gray-300 mb-4">
                Upload your model files directly. We'll handle hosting and execution.
              </p>
              <Badge variant={submissionType === 'upload' ? 'default' : 'secondary'}
                     className={submissionType === 'upload' ? 'bg-orange-500 text-white' : 'bg-gray-600 text-gray-300'}>
                Coming Soon
              </Badge>
            </Card>
          </div>
        </div>

        {submissionType === 'api' && <APISubmissionForm />}
        {submissionType === 'upload' && <UploadSubmissionForm />}
      </Card>

      {/* Requirements */}
      <Card className="p-8 bg-white/90 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4 text-gray-900">📋 Model Requirements</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 text-green-700">✅ Must Have</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Response time &lt; 30 seconds per move</li>
              <li>• Consistent API interface</li>
              <li>• Valid move generation only</li>
              <li>• Deterministic given same game state</li>
              <li>• Error handling for invalid inputs</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-blue-700">💡 Nice to Have</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Confidence scores for moves</li>
              <li>• Reasoning explanations</li>
              <li>• Multiple difficulty levels</li>
              <li>• Fast response (&lt; 5 seconds)</li>
              <li>• Batch processing capability</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function APISubmissionForm() {
  const [formData, setFormData] = useState({
    modelName: '',
    organization: '',
    email: '',
    apiEndpoint: '',
    apiKey: '',
    description: '',
    supportedGames: [] as string[]
  });
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGameToggle = (gameId: string) => {
    setFormData(prev => ({
      ...prev,
      supportedGames: prev.supportedGames.includes(gameId)
        ? prev.supportedGames.filter(id => id !== gameId)
        : [...prev.supportedGames, gameId]
    }));
  };

  const handleTestComplete = (result: TestResult) => {
    setTestResult(result);
  };

  const canSubmit = formData.modelName && formData.organization && formData.email && 
                   formData.apiEndpoint && formData.supportedGames.length > 0 && 
                   testResult?.success;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Model Name *
        </label>
        <input
          type="text"
          value={formData.modelName}
          onChange={(e) => handleInputChange('modelName', e.target.value)}
          className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="e.g., GPT-4o, Claude-3.5-Sonnet"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Research Lab/Organization *
          </label>
          <input
            type="text"
            value={formData.organization}
            onChange={(e) => handleInputChange('organization', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="e.g., OpenAI, Anthropic"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Contact Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="your.email@lab.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          API Endpoint URL *
        </label>
        <input
          type="url"
          value={formData.apiEndpoint}
          onChange={(e) => handleInputChange('apiEndpoint', e.target.value)}
          className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="https://api.yourlab.com/model"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          API Key/Authentication
        </label>
        <input
          type="password"
          value={formData.apiKey}
          onChange={(e) => handleInputChange('apiKey', e.target.value)}
          className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Your API key (encrypted and stored securely)"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Supported Games *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableGames
            .filter(game => !game.status)
            .map((game) => (
            <label key={game.id} className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                className="rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-orange-500"
                checked={formData.supportedGames.includes(game.id)}
                onChange={() => handleGameToggle(game.id)}
              />
              <span className="text-sm text-gray-300">{game.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Model Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-24"
          placeholder="Brief description of your model's capabilities, training approach, and any relevant details..."
        />
      </div>

      {/* API Testing Component */}
      <ModelApiTest 
        apiEndpoint={formData.apiEndpoint}
        apiKey={formData.apiKey}
        onTestComplete={handleTestComplete}
      />

      <div className="flex gap-4">
        <Button 
          className={`flex-1 ${
            canSubmit 
              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
              : 'border-gray-600 text-gray-400'
          }`}
          disabled={!canSubmit}
          variant={canSubmit ? "default" : "outline"}
        >
          Submit for Review
        </Button>
      </div>

      <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
        <p className="text-sm text-gray-300">
          <strong className="text-white">Next Steps:</strong> After successful API testing and submission, we'll add your model to the arena. 
          You'll receive an email with integration results within 24 hours.
        </p>
      </div>
    </div>
  );
}

function UploadSubmissionForm() {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="font-bold text-yellow-800 mb-2">🚧 Coming Soon</h3>
        <p className="text-sm text-yellow-700">
          Direct model upload functionality is currently in development. 
          For now, please use the API integration method above.
        </p>
        <p className="text-xs text-yellow-600 mt-2">
          Expected availability: Q4 2025
        </p>
      </div>

      <div className="opacity-50 pointer-events-none">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <div className="text-4xl mb-4">📤</div>
          <h3 className="font-bold mb-2">Upload Model Files</h3>
          <p className="text-sm text-gray-600">
            Support for PyTorch, TensorFlow, ONNX, and containerized models
          </p>
        </div>
      </div>
    </div>
  );
}
