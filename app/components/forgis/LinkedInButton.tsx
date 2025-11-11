import * as React from "react";
import { Button } from "~/components/ui/button";
import { ExternalLink } from "lucide-react";
import { FORGIS_COLORS } from "~/utils/forgis-colors";

interface LinkedInButtonProps {
  variant?: "default" | "subtle";
  autoShow?: boolean;
  onFollow?: () => void;
}

export function LinkedInButton({ variant = "default", autoShow = false, onFollow }: LinkedInButtonProps) {
  const [showPrompt, setShowPrompt] = React.useState(autoShow);
  const [hasClicked, setHasClicked] = React.useState(false);

  const handleClick = () => {
    if (!hasClicked) {
      setShowPrompt(true);
      setHasClicked(true);
    } else {
      // User confirmed, open LinkedIn
      window.open('https://www.linkedin.com/company/forgisai', '_blank');
      setShowPrompt(false);
      onFollow?.();
    }
  };

  const handleCancel = () => {
    setShowPrompt(false);
  };

  if (variant === "subtle") {
    return (
      <div className="mt-8 text-center">
        <p className="text-sm mb-2" style={{ color: FORGIS_COLORS.platinum }}>
          Stay connected with Forgis AI
        </p>
        <Button
          onClick={handleClick}
          variant="outline"
          size="sm"
          style={{
            borderColor: FORGIS_COLORS.steel,
            color: FORGIS_COLORS.platinum,
          }}
          className="hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Follow us on LinkedIn
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showPrompt ? (
        <Button
          onClick={handleClick}
          style={{
            backgroundColor: FORGIS_COLORS.fire,
            color: FORGIS_COLORS.white,
          }}
          className="w-full hover:bg-[#FF762B] transition-colors"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Follow Forgis on LinkedIn
        </Button>
      ) : (
        <div
          className="p-6 rounded-lg border-2"
          style={{
            backgroundColor: FORGIS_COLORS.gunmetal,
            borderColor: FORGIS_COLORS.fire,
          }}
        >
          <h3
            className="text-lg font-semibold mb-3"
            style={{ color: FORGIS_COLORS.white }}
          >
            📢 Join our community!
          </h3>
          <p
            className="text-sm mb-4 leading-relaxed"
            style={{ color: FORGIS_COLORS.platinum }}
          >
            Give us a follow to catch tomorrow's announcement of the best-performing players against the robot
            and to stay in the loop of Zurich's next big software robotics startup. 🚀
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleClick}
              style={{
                backgroundColor: FORGIS_COLORS.fire,
                color: FORGIS_COLORS.white,
              }}
              className="flex-1 hover:bg-[#FF762B] transition-colors"
            >
              Let's Go! →
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              style={{
                borderColor: FORGIS_COLORS.steel,
                color: FORGIS_COLORS.platinum,
              }}
              className="hover:border-[#FF4D00] hover:text-[#FF4D00]"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
