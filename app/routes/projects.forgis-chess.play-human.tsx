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
  VolumeX,
  Heart
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

// LinkedIn brand color and logo
const LINKEDIN_BLUE = "#0A66C2";

function LinkedInLogoSmall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

export default function ChessClock() {
  const [whiteTime, setWhiteTime] = React.useState(300000); // milliseconds (5+0 default)
  const [blackTime, setBlackTime] = React.useState(300000);
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
  const [showLinkedInPrompt, setShowLinkedInPrompt] = React.useState(false);
  const [linkedInPromptDismissed, setLinkedInPromptDismissed] = React.useState(false);

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);

  // Initialize audio
  React.useEffect(() => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioContextRef.current = new AudioContext();
    }
  }, []);

  // Check if LinkedIn prompt should be shown on mount (session-only)
  React.useEffect(() => {
    const hasSeenPrompt = sessionStorage.getItem('forgis-chess-linkedin-prompt-seen');
    if (!hasSeenPrompt) {
      setShowLinkedInPrompt(true);
    } else {
      setLinkedInPromptDismissed(true);
    }
  }, []);

  const handleLinkedInPromptClose = () => {
    setShowLinkedInPrompt(false);
    setLinkedInPromptDismissed(true);
    sessionStorage.setItem('forgis-chess-linkedin-prompt-seen', 'true');
  };

  const handleLinkedInFollow = () => {
    window.open('https://www.linkedin.com/company/forgisai', '_blank');
    handleLinkedInPromptClose();
  };

  // Play clack sound (chess clock button press)
  const playBeep = React.useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    const context = audioContextRef.current;
    
    // Create a sharp, percussive "clack" sound using white noise
    const bufferSize = context.sampleRate * 0.05; // 50ms
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise and shape it
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500; // Higher frequency for sharper click
    filter.Q.value = 2;
    
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(1.5, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.05);
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(context.destination);
    
    noise.start(context.currentTime);
    noise.stop(context.currentTime + 0.05);
  }, [soundEnabled]);

  // Timer logic - updates every 100ms for precision
  React.useEffect(() => {
    if (activePlayer && !whiteWon && !blackWon) {
      intervalRef.current = setInterval(() => {
        if (activePlayer === "white") {
          setWhiteTime((prev) => {
            if (prev <= 100) {
              setBlackWon(true);
              if (intervalRef.current) clearInterval(intervalRef.current);
              return 0;
            }
            return prev - 100;
          });
        } else {
          setBlackTime((prev) => {
            if (prev <= 100) {
              setWhiteWon(true);
              if (intervalRef.current) clearInterval(intervalRef.current);
              return 0;
            }
            return prev - 100;
          });
        }
      }, 100);
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

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClockPress = (player: Player) => {
    if (whiteWon || blackWon) return;

    playBeep();

    if (activePlayer === null) {
      // First move
      setActivePlayer(player === "white" ? "black" : "white");
    } else if (activePlayer === player) {
      // Add increment to current player (convert seconds to milliseconds)
      if (player === "white") {
        setWhiteTime((prev) => prev + increment * 1000);
      } else {
        setBlackTime((prev) => prev + increment * 1000);
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
    const initialTime = customMinutes * 60 * 1000; // Convert to milliseconds
    setWhiteTime(initialTime);
    setBlackTime(initialTime);
    setIncrement(customIncrement);
  };

  const applyPreset = (preset: TimeControl) => {
    setCustomMinutes(preset.minutes);
    setCustomIncrement(preset.increment);
    setWhiteTime(preset.minutes * 60 * 1000); // Convert to milliseconds
    setBlackTime(preset.minutes * 60 * 1000);
    setIncrement(preset.increment);
    setActivePlayer(null);
    setWhiteWon(false);
    setBlackWon(false);
    setShowSettings(false);
  };

  const applyCustomTime = () => {
    setWhiteTime(customMinutes * 60 * 1000); // Convert to milliseconds
    setBlackTime(customMinutes * 60 * 1000);
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
      {/* Header - Ultra compact */}
      <header 
        className="flex-shrink-0 border-b px-2 py-1"
        style={{ 
          backgroundColor: FORGIS_COLORS.gunmetal,
          borderColor: FORGIS_COLORS.steel + '50'
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Link to="/projects/forgis-chess">
              <Button
                variant="outline"
                size="sm"
                style={{
                  borderColor: FORGIS_COLORS.steel,
                  color: FORGIS_COLORS.platinum,
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                }}
                className="hover:border-[#FF4D00] hover:text-[#FF4D00]"
              >
                <ArrowLeft className="w-3 h-3" />
              </Button>
            </Link>
            <h1 
              className="text-sm font-bold"
              style={{ color: FORGIS_COLORS.white }}
            >
              Chess Clock
            </h1>
          </div>
        </div>
      </header>

      {/* LinkedIn Prompt - First Visit Overlay */}
      {showLinkedInPrompt && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={handleLinkedInPromptClose}
        >
          <Card 
            className="p-8 max-w-md w-full border-2"
            style={{ 
              backgroundColor: FORGIS_COLORS.gunmetal,
              borderColor: LINKEDIN_BLUE,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-6">
              <div 
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                style={{ backgroundColor: LINKEDIN_BLUE }}
              >
                <LinkedInLogoSmall className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold" style={{ color: FORGIS_COLORS.white }}>
                Show Your Support
              </h2>
              
              <p className="text-base leading-relaxed" style={{ color: FORGIS_COLORS.platinum }}>
                If you like this event, please show your support by taking 5s to give our LinkedIn a follow.
              </p>
              
              <p className="text-sm leading-relaxed flex items-center justify-center gap-2" style={{ color: FORGIS_COLORS.platinum }}>
                Good vibes only, tomorrow's winner announcement and maybe your next job
                <Heart className="w-4 h-4" style={{ color: FORGIS_COLORS.fire, fill: FORGIS_COLORS.fire }} />
              </p>
              
              <Button
                onClick={handleLinkedInFollow}
                className="w-full"
                style={{
                  backgroundColor: LINKEDIN_BLUE,
                  color: 'white',
                }}
              >
                <LinkedInLogoSmall className="w-5 h-5 mr-2" />
                Follow Forgis on LinkedIn
              </Button>
            </div>
          </Card>
        </div>
      )}

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
                color: whiteTime <= 10000 && activePlayer === "white" 
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
                color: blackTime <= 10000 && activePlayer === "black" 
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

      {/* Controls - Fixed bottom - Ultra compact */}
      <div 
        className="flex-shrink-0 border-t px-2 py-1"
        style={{ 
          backgroundColor: FORGIS_COLORS.gunmetal,
          borderColor: FORGIS_COLORS.steel + '50'
        }}
      >
        <div className="flex gap-1 justify-center items-center">
          <Button
            onClick={handlePause}
            disabled={activePlayer === null || whiteWon || blackWon}
            variant="outline"
            size="sm"
            style={{
              borderColor: FORGIS_COLORS.steel,
              color: FORGIS_COLORS.platinum,
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
            }}
            className="hover:border-[#FF4D00] hover:text-[#FF4D00] disabled:opacity-30"
          >
            <Pause className="w-3 h-3" />
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            style={{
              borderColor: FORGIS_COLORS.steel,
              color: FORGIS_COLORS.platinum,
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
            }}
            className="hover:border-[#FF4D00] hover:text-[#FF4D00]"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="sm"
            style={{
              borderColor: FORGIS_COLORS.steel,
              color: FORGIS_COLORS.platinum,
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
            }}
            className="hover:border-[#FF4D00] hover:text-[#FF4D00]"
          >
            <Settings className="w-3 h-3" />
          </Button>
          
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="outline"
            size="sm"
            style={{
              borderColor: FORGIS_COLORS.steel,
              color: FORGIS_COLORS.platinum,
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
            }}
            className="hover:border-[#FF4D00] hover:text-[#FF4D00]"
          >
            {soundEnabled ? (
              <Volume2 className="w-3 h-3" />
            ) : (
              <VolumeX className="w-3 h-3" />
            )}
          </Button>
          
          {/* LinkedIn Icon - Shows after prompt is dismissed */}
          {linkedInPromptDismissed && (
            <Button
              onClick={() => setShowLinkedInPrompt(true)}
              variant="outline"
              size="sm"
              style={{
                borderColor: LINKEDIN_BLUE,
                color: LINKEDIN_BLUE,
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
              }}
              className="hover:bg-[#0A66C2] hover:text-white"
            >
              <LinkedInLogoSmall className="w-3 h-3" />
            </Button>
          )}
          
          {/* Time Control Info - Inline */}
          <span className="text-xs ml-2" style={{ color: FORGIS_COLORS.platinum }}>
            <span className="font-mono" style={{ color: FORGIS_COLORS.fire }}>{customMinutes}min</span>
            {customIncrement > 0 && (
              <>+<span className="font-mono" style={{ color: FORGIS_COLORS.fire }}>{customIncrement}s</span></>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
