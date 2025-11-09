import { useState, useEffect, useRef } from "react";
import { Link } from "@remix-run/react";
import { json, type MetaFunction } from "@remix-run/node";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings,
  Clock,
  Volume2,
  VolumeX
} from "lucide-react";

export const meta: MetaFunction = () => {
  return [
    { title: "Chess Clock | Jonas Petersen" },
    { 
      name: "description", 
      content: "A modern chess clock web application with customizable time controls, increment support, and clean interface." 
    },
  ];
};

export const loader = async () => {
  return json({});
};

interface TimeControl {
  minutes: number;
  increment: number;
  label: string;
}

const PRESETS: TimeControl[] = [
  { minutes: 1, increment: 0, label: "Bullet 1+0" },
  { minutes: 1, increment: 1, label: "Bullet 1+1" },
  { minutes: 3, increment: 0, label: "Blitz 3+0" },
  { minutes: 3, increment: 2, label: "Blitz 3+2" },
  { minutes: 5, increment: 0, label: "Blitz 5+0" },
  { minutes: 5, increment: 3, label: "Blitz 5+3" },
  { minutes: 10, increment: 0, label: "Rapid 10+0" },
  { minutes: 15, increment: 10, label: "Rapid 15+10" },
  { minutes: 30, increment: 0, label: "Classical 30+0" },
];

type Player = "white" | "black";

export default function ChessClock() {
  const [whiteTime, setWhiteTime] = useState(300); // seconds
  const [blackTime, setBlackTime] = useState(300); // seconds
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [increment, setIncrement] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [customIncrement, setCustomIncrement] = useState(0);
  const [whiteWon, setWhiteWon] = useState(false);
  const [blackWon, setBlackWon] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.value = 0;
      
      oscillator.start();
      
      // Store play function
      audioRef.current = {
        play: () => {
          if (soundEnabled && context.state === 'running') {
            gainNode.gain.setValueAtTime(0.3, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
          }
        }
      } as any;
    }
  }, [soundEnabled]);

  // Timer logic
  useEffect(() => {
    if (activePlayer && !whiteWon && !blackWon) {
      intervalRef.current = setInterval(() => {
        if (activePlayer === "white") {
          setWhiteTime((prev) => {
            if (prev <= 1) {
              setBlackWon(true);
              if (intervalRef.current) clearInterval(intervalRef.current);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime((prev) => {
            if (prev <= 1) {
              setWhiteWon(true);
              if (intervalRef.current) clearInterval(intervalRef.current);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activePlayer, whiteWon, blackWon]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClockPress = (player: Player) => {
    if (whiteWon || blackWon) return;

    // Play sound
    if (audioRef.current && soundEnabled) {
      try {
        audioRef.current.play();
      } catch (e) {
        console.log("Audio play failed:", e);
      }
    }

    if (activePlayer === null) {
      // First move
      setActivePlayer(player === "white" ? "black" : "white");
    } else if (activePlayer === player) {
      // Add increment to current player
      if (player === "white") {
        setWhiteTime((prev) => prev + increment);
      } else {
        setBlackTime((prev) => prev + increment);
      }
      // Switch to other player
      setActivePlayer(player === "white" ? "black" : "white");
    }
  };

  const handlePause = () => {
    setActivePlayer(null);
  };

  const handleReset = () => {
    setActivePlayer(null);
    setWhiteWon(false);
    setBlackWon(false);
    const initialTime = customMinutes * 60;
    setWhiteTime(initialTime);
    setBlackTime(initialTime);
    setIncrement(customIncrement);
  };

  const applyPreset = (preset: TimeControl) => {
    setCustomMinutes(preset.minutes);
    setCustomIncrement(preset.increment);
    setWhiteTime(preset.minutes * 60);
    setBlackTime(preset.minutes * 60);
    setIncrement(preset.increment);
    setActivePlayer(null);
    setWhiteWon(false);
    setBlackWon(false);
    setShowSettings(false);
  };

  const applyCustomTime = () => {
    setWhiteTime(customMinutes * 60);
    setBlackTime(customMinutes * 60);
    setIncrement(customIncrement);
    setActivePlayer(null);
    setWhiteWon(false);
    setBlackWon(false);
    setShowSettings(false);
  };

  return (
    <div className="h-screen bg-[#122128] text-white flex flex-col overflow-hidden">
      {/* Header - Compact for mobile */}
      <header className="flex-shrink-0 bg-[#122128] border-b border-[#707B84]/30 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link to="/">
              <div className="w-8 h-8 rounded-full bg-[#FF4D00] flex items-center justify-center hover:bg-[#FF762B] transition-colors">
                <span className="text-white font-bold text-sm">JP</span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#FF4D00]" />
              <h1 className="text-lg font-bold text-white hidden sm:block">Chess Clock</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              to="/" 
              className="text-xs font-medium text-[#CCD3D6] hover:text-[#FF4D00] transition-colors hidden sm:flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - No scroll, fills viewport */}
      <div className="flex-1 flex flex-col min-h-0 px-4 py-3 gap-3">
        {/* Settings Panel - Collapsible overlay on mobile */}
        {showSettings && (
          <div className="fixed inset-0 bg-[#122128]/95 z-50 overflow-y-auto">
            <div className="min-h-screen p-4">
              <Card className="bg-[#122128] border-[#707B84] p-4 max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Time Controls</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                    className="border-[#707B84] text-[#CCD3D6] hover:border-[#FF4D00] hover:text-[#FF4D00]"
                  >
                    Close
                  </Button>
                </div>

                {/* Presets */}
                <div className="mb-4">
                  <h3 className="text-base font-semibold mb-2 text-white">Presets</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESETS.map((preset) => (
                      <Button
                        key={preset.label}
                        onClick={() => applyPreset(preset)}
                        variant="outline"
                        size="sm"
                        className="border-[#707B84] text-[#CCD3D6] hover:border-[#FF4D00] hover:bg-[#FF4D00]/10"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Time */}
                <div>
                  <h3 className="text-base font-semibold mb-2 text-white">Custom Time</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-[#CCD3D6]">
                        Minutes
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(parseFloat(e.target.value))}
                        className="w-full p-2 bg-[#122128] border border-[#707B84] rounded-lg text-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-[#CCD3D6]">
                        Increment
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={customIncrement}
                        onChange={(e) => setCustomIncrement(parseInt(e.target.value))}
                        className="w-full p-2 bg-[#122128] border border-[#707B84] rounded-lg text-white focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={applyCustomTime}
                        size="sm"
                        className="w-full bg-[#FF4D00] hover:bg-[#FF762B] text-white"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Clock Display - Fills available space, no scroll */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-0">
          {/* White Clock */}
          <button
            onClick={() => handleClockPress("white")}
            disabled={whiteWon || blackWon}
            className={`relative rounded-lg transition-all duration-200 touch-manipulation ${
              activePlayer === "white"
                ? "bg-[#FF4D00]/20 border-4 border-[#FF4D00] shadow-lg shadow-[#FF4D00]/50"
                : whiteWon
                ? "bg-green-500/20 border-4 border-green-500"
                : blackWon
                ? "bg-[#DC4B07]/20 border-4 border-[#DC4B07] opacity-50"
                : "bg-[#122128] border-4 border-[#707B84] hover:border-[#CCD3D6] active:border-[#FF762B]"
            } ${whiteWon || blackWon ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <Badge 
                variant="secondary" 
                className="mb-2 text-xs bg-[#707B84] text-white"
              >
                White
              </Badge>
              <div className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-mono font-bold ${
                whiteTime <= 10 && activePlayer === "white" ? "text-[#DC4B07] animate-pulse" : "text-white"
              }`}>
                {formatTime(whiteTime)}
              </div>
              {whiteWon && (
                <Badge className="mt-2 bg-green-500 text-white text-sm">
                  Winner! 🏆
                </Badge>
              )}
              {blackWon && (
                <Badge className="mt-2 bg-[#DC4B07] text-white text-xs">
                  Time Up
                </Badge>
              )}
            </div>
          </button>

          {/* Black Clock */}
          <button
            onClick={() => handleClockPress("black")}
            disabled={whiteWon || blackWon}
            className={`relative rounded-lg transition-all duration-200 touch-manipulation ${
              activePlayer === "black"
                ? "bg-[#FF4D00]/20 border-4 border-[#FF4D00] shadow-lg shadow-[#FF4D00]/50"
                : blackWon
                ? "bg-green-500/20 border-4 border-green-500"
                : whiteWon
                ? "bg-[#DC4B07]/20 border-4 border-[#DC4B07] opacity-50"
                : "bg-[#122128] border-4 border-[#707B84] hover:border-[#CCD3D6] active:border-[#FF762B]"
            } ${whiteWon || blackWon ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <Badge 
                variant="secondary" 
                className="mb-2 text-xs bg-[#707B84] text-white"
              >
                Black
              </Badge>
              <div className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-mono font-bold ${
                blackTime <= 10 && activePlayer === "black" ? "text-[#DC4B07] animate-pulse" : "text-white"
              }`}>
                {formatTime(blackTime)}
              </div>
              {blackWon && (
                <Badge className="mt-2 bg-green-500 text-white text-sm">
                  Winner! 🏆
                </Badge>
              )}
              {whiteWon && (
                <Badge className="mt-2 bg-[#DC4B07] text-white text-xs">
                  Time Up
                </Badge>
              )}
            </div>
          </button>
        </div>

        {/* Controls - Compact, fixed bottom */}
        <div className="flex-shrink-0 bg-[#122128] border-t border-[#707B84]/30 p-3">
          <div className="flex flex-wrap gap-2 justify-center items-center">
            <Button
              onClick={handlePause}
              disabled={activePlayer === null || whiteWon || blackWon}
              variant="outline"
              size="sm"
              className="border-[#707B84] text-[#CCD3D6] hover:border-[#FF4D00] hover:text-[#FF4D00] disabled:opacity-30 flex-1 sm:flex-initial"
            >
              <Pause className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Pause</span>
            </Button>
            
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="border-[#707B84] text-[#CCD3D6] hover:border-[#FF4D00] hover:text-[#FF4D00] flex-1 sm:flex-initial"
            >
              <RotateCcw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
              className="border-[#707B84] text-[#CCD3D6] hover:border-[#FF4D00] hover:text-[#FF4D00] flex-1 sm:flex-initial"
            >
              <Settings className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              variant="outline"
              size="sm"
              className="border-[#707B84] text-[#CCD3D6] hover:border-[#FF4D00] hover:text-[#FF4D00] flex-1 sm:flex-initial"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 sm:mr-2" />
              ) : (
                <VolumeX className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Sound</span>
            </Button>
          </div>

          {/* Time Control Info - Compact */}
          <div className="mt-2 text-center">
            <p className="text-[#CCD3D6] text-xs">
              <span className="font-mono text-[#FF4D00]">{customMinutes}min</span>
              {customIncrement > 0 && (
                <> + <span className="font-mono text-[#FF4D00]">{customIncrement}s</span></>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
