// The hero claim as a signal: the sensors drift before the camera sees anything.
const W = 600;
const H = 60;
const BASE = 40;
const DRIFT = 240; // sensors start to drift
const DEFECT = 480; // camera sees the defect

const noise = (x: number) =>
  1.4 * Math.sin(x * 0.31) + 0.9 * Math.sin(x * 0.77 + 1.3) + 0.6 * Math.sin(x * 1.9 + 0.2);

function signal(x: number) {
  const t = Math.min(1, Math.max(0, (x - DRIFT) / (DEFECT - DRIFT)));
  // Drift: slow upward creep with growing jitter, then a step at the defect.
  let v = noise(x) * (1 + 1.8 * t * t) - 9 * t * t;
  if (x >= DEFECT) v -= 14 + noise(x * 1.7) * 2;
  return BASE + v;
}

let path = "";
for (let x = 0; x <= W; x += 2) path += `${x === 0 ? "M" : "L"}${x},${signal(x).toFixed(1)}`;

const pct = (x: number) => `${(x / W) * 100}%`;
const label = "absolute -translate-x-1/2 whitespace-nowrap font-mono text-[10px] career-fade";

export function ScrapTrace() {
  return (
    <div className="relative mt-4 h-[84px]" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-x-0 top-0 w-full" style={{ height: H }}>
        <rect x={DRIFT} y={0} width={DEFECT - DRIFT} height={H} className="fill-orange-500/10 career-fade"
          style={{ animationDelay: "1.1s" }} />
        <clipPath id="scrap-wipe">
          <rect width={W} height={H} className="career-wipe" />
        </clipPath>
        <path d={path} clipPath="url(#scrap-wipe)" fill="none" stroke="currentColor" strokeWidth="1.5"
          vectorEffect="non-scaling-stroke" className="text-orange-500" />
        {[DRIFT, DEFECT].map((x, i) => (
          <line key={x} x1={x} x2={x} y1={0} y2={H} stroke="currentColor" strokeWidth="1" strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke" className={`career-fade ${i ? "text-gray-500" : "text-orange-400"}`}
            style={{ animationDelay: `${(x / W) * 1.2}s` }} />
        ))}
      </svg>
      <span className={`${label} text-orange-400`} style={{ left: pct(DRIFT), top: H + 6, animationDelay: "0.6s" }}>
        sensors drift
      </span>
      <span className={`${label} hidden sm:block text-orange-400/70`} style={{ left: pct((DRIFT + DEFECT) / 2), top: H + 6, animationDelay: "1.1s" }}>
        lead time
      </span>
      <span className={`${label} text-gray-400`} style={{ left: pct(DEFECT), top: H + 6, animationDelay: "1.05s" }}>
        camera sees it
      </span>
    </div>
  );
}
