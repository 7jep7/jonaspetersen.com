import * as React from "react";
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
  Volume2,
  VolumeX
} from "lucide-react";
import { FORGIS_COLORS } from "~/utils/forgis-colors";
import { LinkedInButton } from "~/components/forgis/LinkedInButton";

export const meta: MetaFunction = () => {
  return [
    { title: "Chess Clock - Forgis Chess" },
    { 
      name: "description", 
      content: "A simple chess clock for friendly matches at the Forgis booth." 
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
  { minutes: 3, increment: 0, label: "Blitz 3+0" },
  { minutes: 3, increment: 2, label: "Blitz 3+2" },
  { minutes: 5, increment: 0, label: "Blitz 5+0" },
  { minutes: 5, increment: 3, label: "Blitz 5+3" },
  { minutes: 10, increment: 0, label: "Rapid 10+0" },
];

type Player = "white" | "black";

export default function ChessClock() {
  const [whiteTime, setWhiteTime] = React.useState(300); // seconds (5+0 default)
  const [blackTime, setBlackTime] = React.useState(300);
  const [activePlayer, setActivePlayer] = React.useState<Player | null>(null);
  const [increment, setIncrement] = React.useState(0);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(false);
  const [customMinutes, setCustomMinutes] = React.useState(5);
  const [customIncrement, setCustomIncrement] = React.useState(0);
  const [whiteWon, setWhiteWon] = React.useState(false);
  const [blackWon, setBlackWon] = React.useState(false);
  const [gamesCompleted, setGamesCompleted] = React.useState(0);
  const [hasShownLinkedIn, setHasShownLinkedIn] = React.useState(false);

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);

  // Initialize audio
  React.useEffect(() => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioContextRef.current = new AudioContext();
    }
  }, []);

  // Play beep sound
  const playBeep = React.useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  }, [soundEnabled]);

  // Timer logic
  React.useEffect(() => {
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

  // Check if game is over
  React.useEffect(() => {
    if ((whiteWon || blackWon) && !hasShownLinkedIn && gamesCompleted === 0) {
      setGamesCompleted(1);
      setHasShownLinkedIn(true);
    }
  }, [whiteWon, blackWon, hasShownLinkedIn, gamesCompleted]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClockPress = (player: Player) => {
    if (whiteWon || blackWon) return;

    playBeep();

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
    <div 
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: FORGIS_COLORS.gunmetal }}
    >
      {/* Header - Compact */}
      <header 
        className="flex-shrink-0 border-b px-4 py-3"
        style={{ 
          backgroundColor: FORGIS_COLORS.gunmetal,
          borderColor: FORGIS_COLORS.steel + '50'
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link to="/projects/forgis-chess">
              <Button
                variant="outline"
                size="sm"
                style={{
                  borderColor: FORGIS_COLORS.steel,
                  color: FORGIS_COLORS.platinum,
                }}
                className="hover:border-[#FF4D00] hover:text-[#FF4D00]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <h1 
              className="text-lg sm:text-xl font-bold"
              style={{ color: FORGIS_COLORS.white }}
            >
              Chess Clock
            </h1>
          </div>
        </div>
      </header>

      {/* Settings Panel - Overlay */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ backgroundColor: FORGIS_COLORS.gunmetal + 'F0' }}
        >
          <div className="min-h-screen p-4">
            <Card 
              className="p-6 max-w-2xl mx-auto border-2"
              style={{ 
                backgroundColor: FORGIS_COLORS.gunmetal,
                borderColor: FORGIS_COLORS.steel,
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: FORGIS_COLORS.white }}>
                  Time Controls
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  style={{
                    borderColor: FORGIS_COLORS.steel,
                    color: FORGIS_COLORS.platinum,
                  }}
                  className="hover:border-[#FF4D00] hover:text-[#FF4D00]"
                >
                  Close
                </Button>
              </div>

              {/* Presets */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: FORGIS_COLORS.white }}>
                  Presets
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      onClick={() => applyPreset(preset)}
                      variant="outline"
                      style={{
                        borderColor: FORGIS_COLORS.steel,
                        color: FORGIS_COLORS.platinum,
                      }}
                      className="hover:border-[#FF4D00] hover:text-[#FF4D00]"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Time */}
              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: FORGIS_COLORS.white }}>
                  Custom Time
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: FORGIS_COLORS.platinum }}
                    >
                      Minutes
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(parseFloat(e.target.value))}
                      className="w-full p-2 rounded-lg border-2"
                      style={{
                        backgroundColor: FORGIS_COLORS.gunmetal,
                        borderColor: FORGIS_COLORS.steel,
                        color: FORGIS_COLORS.white,
                      }}
                    />
                  </div>
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: FORGIS_COLORS.platinum }}
                    >
                      Increment (sec)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={customIncrement}
                      onChange={(e) => setCustomIncrement(parseInt(e.target.value))}
                      className="w-full p-2 rounded-lg border-2"
                      style={{
                        backgroundColor: FORGIS_COLORS.gunmetal,
                        borderColor: FORGIS_COLORS.steel,
                        color: FORGIS_COLORS.white,
                      }}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={applyCustomTime}
                      className="w-full"
                      style={{
                        backgroundColor: FORGIS_COLORS.fire,
                        color: FORGIS_COLORS.white,
                      }}
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

      {/* Clock Display - Fills available space */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 min-h-0">
        {/* White Clock */}
        <button
          onClick={() => handleClockPress("white")}
          disabled={whiteWon || blackWon}
          className="relative rounded-xl transition-all duration-200 touch-manipulation"
          style={{
            backgroundColor: activePlayer === "white" 
              ? FORGIS_COLORS.fire + '30' 
              : FORGIS_COLORS.gunmetal,
            border: `4px solid ${
              activePlayer === "white"
                ? FORGIS_COLORS.fire
                : whiteWon
                ? '#10B981'
                : blackWon
                ? FORGIS_COLORS.flicker
                : FORGIS_COLORS.steel
            }`,
            cursor: whiteWon || blackWon ? 'not-allowed' : 'pointer',
            opacity: blackWon ? 0.5 : 1,
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <Badge 
              className="mb-4 text-xs"
              style={{ 
                backgroundColor: FORGIS_COLORS.steel,
                color: FORGIS_COLORS.white
              }}
            >
              White
            </Badge>
            <div 
              className="text-5xl sm:text-6xl md:text-7xl font-mono font-bold"
              style={{ 
                color: whiteTime <= 10 && activePlayer === "white" 
                  ? FORGIS_COLORS.flicker 
                  : FORGIS_COLORS.white
              }}
            >
              {formatTime(whiteTime)}
            </div>
            {whiteWon && (
              <Badge 
                className="mt-4"
                style={{ backgroundColor: '#10B981', color: FORGIS_COLORS.white }}
              >
                Winner! 🏆
              </Badge>
            )}
            {blackWon && (
              <Badge 
                className="mt-4"
                style={{ backgroundColor: FORGIS_COLORS.flicker, color: FORGIS_COLORS.white }}
              >
                Time Up
              </Badge>
            )}
          </div>
        </button>

        {/* Black Clock */}
        <button
          onClick={() => handleClockPress("black")}
          disabled={whiteWon || blackWon}
          className="relative rounded-xl transition-all duration-200 touch-manipulation"
          style={{
            backgroundColor: activePlayer === "black" 
              ? FORGIS_COLORS.fire + '30' 
              : FORGIS_COLORS.gunmetal,
            border: `4px solid ${
              activePlayer === "black"
                ? FORGIS_COLORS.fire
                : blackWon
                ? '#10B981'
                : whiteWon
                ? FORGIS_COLORS.flicker
                : FORGIS_COLORS.steel
            }`,
            cursor: whiteWon || blackWon ? 'not-allowed' : 'pointer',
            opacity: whiteWon ? 0.5 : 1,
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <Badge 
              className="mb-4 text-xs"
              style={{ 
                backgroundColor: FORGIS_COLORS.steel,
                color: FORGIS_COLORS.white
              }}
            >
              Black
            </Badge>
            <div 
              className="text-5xl sm:text-6xl md:text-7xl font-mono font-bold"
              style={{ 
                color: blackTime <= 10 && activePlayer === "black" 
                  ? FORGIS_COLORS.flicker 
                  : FORGIS_COLORS.white
              }}
            >
              {formatTime(blackTime)}
            </div>
            {blackWon && (
              <Badge 
                className="mt-4"
                style={{ backgroundColor: '#10B981', color: FORGIS_COLORS.white }}
              >
                Winner! 🏆
              </Badge>
            )}
            {whiteWon && (
              <Badge 
                className="mt-4"
                style={{ backgroundColor: FORGIS_COLORS.flicker, color: FORGIS_COLORS.white }}
              >
                Time Up
              </Badge>
            )}
          </div>
        </button>
      </div>

      {/* Controls - Fixed bottom */}
      <div 
        className="flex-shrink-0 border-t p-4"
        style={{ 
          backgroundColor: FORGIS_COLORS.gunmetal,
          borderColor: FORGIS_COLORS.steel + '50'
        }}
      >
        <div className="flex flex-wrap gap-2 justify-center items-center mb-3">
          <Button
            onClick={handlePause}
            disabled={activePlayer === null || whiteWon || blackWon}
            variant="outline"
            size="sm"
            style={{
              borderColor: FORGIS_COLORS.steel,
              color: FORGIS_COLORS.platinum,
            }}
            className="hover:border-[#FF4D00] hover:text-[#FF4D00] disabled:opacity-30"
          >
            <Pause className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Pause</span>
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            style={{
              borderColor: FORGIS_COLORS.steel,
              color: FORGIS_COLORS.platinum,
            }}
            className="hover:border-[#FF4D00] hover:text-[#FF4D00]"
          >
            <RotateCcw className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="sm"
            style={{
              borderColor: FORGIS_COLORS.steel,
              color: FORGIS_COLORS.platinum,
            }}
            className="hover:border-[#FF4D00] hover:text-[#FF4D00]"
          >
            <Settings className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
          
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="outline"
            size="sm"
            style={{
              borderColor: FORGIS_COLORS.steel,
              color: FORGIS_COLORS.platinum,
            }}
            className="hover:border-[#FF4D00] hover:text-[#FF4D00]"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 sm:mr-2" />
            ) : (
              <VolumeX className="w-4 h-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Sound</span>
          </Button>
        </div>

        {/* Time Control Info */}
        <div className="text-center mb-3">
          <p className="text-xs" style={{ color: FORGIS_COLORS.platinum }}>
            <span className="font-mono" style={{ color: FORGIS_COLORS.fire }}>{customMinutes}min</span>
            {customIncrement > 0 && (
              <> + <span className="font-mono" style={{ color: FORGIS_COLORS.fire }}>{customIncrement}s</span></>
            )}
          </p>
        </div>

        {/* LinkedIn Button - Subtle, appears after first game */}
        {hasShownLinkedIn && (
          <div className="mt-4">
            <LinkedInButton variant="subtle" autoShow={gamesCompleted === 1} />
          </div>
        )}
      </div>
    </div>
  );
}
