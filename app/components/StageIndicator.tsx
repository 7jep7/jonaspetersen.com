import { 
  ClipboardList, 
  MessageSquare, 
  Code, 
  TestTube, 
  CheckCircle 
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

type ConversationStage = 'project_kickoff' | 'gather_requirements' | 'code_generation' | 'refinement_testing' | 'completed';

interface StageIndicatorProps {
  currentStage: ConversationStage;
  nextStage?: ConversationStage;
  confidence?: number;
}

const stageConfig = {
  project_kickoff: {
    icon: ClipboardList,
    label: "Project Kickoff",
    description: "Analyzing project requirements",
    color: "blue"
  },
  gather_requirements: {
    icon: MessageSquare,
    label: "Requirements",
    description: "Gathering technical details",
    color: "orange"
  },
  code_generation: {
    icon: Code,
    label: "Code Generation",
    description: "Creating PLC code",
    color: "purple"
  },
  refinement_testing: {
    icon: TestTube,
    label: "Refinement",
    description: "Testing and optimization",
    color: "green"
  },
  completed: {
    icon: CheckCircle,
    label: "Completed",
    description: "Project finished",
    color: "emerald"
  }
} as const;

const stages: ConversationStage[] = [
  'project_kickoff',
  'gather_requirements', 
  'code_generation',
  'refinement_testing',
  'completed'
];

export function StageIndicator({ currentStage, nextStage, confidence }: StageIndicatorProps) {
  const currentStageIndex = stages.indexOf(currentStage);
  
  return (
    <div className="flex items-center space-x-1">
      {stages.map((stage, index) => {
        const config = stageConfig[stage];
        const Icon = config.icon;
        const isActive = stage === currentStage;
        const isCompleted = index < currentStageIndex;
        const isNext = stage === nextStage;
        return (
          <div key={stage} className="flex items-center">
            {/* Stage indicator with brief hover tooltip */}
            <HoverTooltip label={config.label}>
              <div
                className={`
                  relative flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-200 hover:z-40
                  ${isActive
                    ? 'border-gray-400 bg-gray-700 text-white font-medium'
                    : isCompleted
                    ? 'border-gray-500 bg-gray-600 text-gray-200'
                    : 'border-gray-700 bg-gray-800 text-gray-500'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
              </div>
            </HoverTooltip>

            {/* Connector line */}
            {index < stages.length - 1 && (
              <div
                className={`
                  w-4 h-0.5 mx-0.5 transition-all duration-200
                  ${index < currentStageIndex
                    ? 'bg-gray-500'
                    : index === currentStageIndex
                    ? 'bg-gray-600'
                    : 'bg-gray-700'
                  }
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Small tooltip wrapper that shows the label briefly on hover (~1.2s)
function HoverTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (e?: React.MouseEvent) => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      // place tooltip centered above the element
      setCoords({ x: rect.left + rect.width / 2, y: rect.top });
    } else if (e) {
      setCoords({ x: e.clientX, y: e.clientY });
    }

    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 1200);
  };

  const hide = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  };

  useEffect(() => {
    // mark as mounted so we can safely use document/createPortal on the client
    setMounted(true);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Tooltip element rendered into body to avoid clipping/overflow issues.
  // Only render the portal on the client (mounted) to avoid SSR `document` errors.
  const tooltip = mounted && coords ? (
    <div
      role="status"
      aria-hidden={!visible}
      style={{ left: coords.x, top: coords.y - 8 }}
      className={`fixed transform -translate-x-1/2 -translate-y-full px-2 py-1 bg-gray-900 border border-gray-700 text-white text-xs rounded-lg transition-opacity duration-150 whitespace-nowrap z-50 shadow-lg pointer-events-none ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {label}
    </div>
  ) : null;

  return (
    <div
      ref={wrapperRef}
      className="relative"
  onMouseEnter={show}
  onMouseLeave={hide}
  onFocus={() => show()}
  onBlur={() => hide()}
      // allow the child to receive pointer events; tooltip itself is pointer-events-none
    >
      {children}
      {mounted && tooltip ? createPortal(tooltip, document.body) : null}
    </div>
  );
}