import { useEffect, useRef } from "react";

// A machine signal scrolling left. Left of "now" is what the sensor recorded,
// right of it is the forecast, with an uncertainty band that widens with horizon.
const W = 1000;
const H = 80;
const NOW = 720;
const STEP = 4;
const SPEED = 24; // signal units per second
const EVENT_PERIOD = 520;

function signal(x: number) {
  const base =
    0.45 * Math.sin(x * 0.045) +
    0.25 * Math.sin(x * 0.011 + 1.3) +
    0.08 * Math.sin(x * 0.31);
  // Periodic fault: a sharp spike the forecast should see coming.
  const d = ((x % EVENT_PERIOD) + EVENT_PERIOD) % EVENT_PERIOD - EVENT_PERIOD / 2;
  return base + 1.1 * Math.exp(-(d * d) / 60);
}

const y = (v: number) => H / 2 - v * (H / 4.6);

function paths(t: number) {
  let observed = "";
  let forecast = "";
  const upper: string[] = [];
  const lower: string[] = [];

  for (let x = 0; x <= W; x += STEP) {
    const v = signal(x + t);
    if (x <= NOW) {
      observed += `${x === 0 ? "M" : "L"}${x},${y(v).toFixed(1)}`;
    }
    if (x >= NOW) {
      forecast += `${x === NOW ? "M" : "L"}${x},${y(v).toFixed(1)}`;
      const spread = ((x - NOW) / (W - NOW)) * 0.35;
      upper.push(`${x},${y(v + spread).toFixed(1)}`);
      lower.unshift(`${x},${y(v - spread).toFixed(1)}`);
    }
  }
  // Spike peaks sit where x + t is an odd multiple of half the period.
  const first = (((EVENT_PERIOD / 2 - t) % EVENT_PERIOD) + EVENT_PERIOD) % EVENT_PERIOD;
  const event = [first, first + EVENT_PERIOD].find((x) => x >= NOW && x <= W) ?? null;
  return { observed, forecast, band: `M${upper.join("L")}L${lower.join("L")}Z`, event };
}

export function SensorTrace() {
  const observedRef = useRef<SVGPathElement>(null);
  const forecastRef = useRef<SVGPathElement>(null);
  const bandRef = useRef<SVGPathElement>(null);
  const eventRef = useRef<SVGLineElement>(null);
  const initial = paths(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = paths(((now - start) / 1000) * SPEED);
      observedRef.current?.setAttribute("d", p.observed);
      forecastRef.current?.setAttribute("d", p.forecast);
      bandRef.current?.setAttribute("d", p.band);
      const marker = eventRef.current;
      if (marker) {
        marker.setAttribute("opacity", p.event !== null ? "1" : "0");
        if (p.event !== null) {
          marker.setAttribute("x1", String(p.event));
          marker.setAttribute("x2", String(p.event));
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative mt-4 select-none" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-16 md:h-20">
        <path ref={bandRef} d={initial.band} className="fill-orange-500/10" />
        <path ref={observedRef} d={initial.observed} fill="none" stroke="currentColor" strokeWidth="1.5"
          vectorEffect="non-scaling-stroke" className="text-orange-500/70" />
        <path ref={forecastRef} d={initial.forecast} fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeDasharray="4 4" vectorEffect="non-scaling-stroke" className="text-orange-400/60" />
        <line x1={NOW} x2={NOW} y1="4" y2={H - 4} stroke="currentColor" strokeWidth="1"
          vectorEffect="non-scaling-stroke" className="text-gray-600" />
        {/* Predicted fault: marked once the spike enters the forecast window */}
        <line ref={eventRef} x1={initial.event ?? 0} x2={initial.event ?? 0} y1="2" y2={H - 2}
          opacity={initial.event !== null ? 1 : 0} stroke="currentColor" strokeWidth="1" strokeDasharray="2 3"
          vectorEffect="non-scaling-stroke" className="text-orange-400" />
      </svg>
      <div className="relative h-4 mt-1 font-mono text-[10px] uppercase tracking-widest text-gray-500">
        <span className="absolute left-0">sensor</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${(NOW / W) * 100}%` }}>now</span>
        <span className="absolute right-0">forecast</span>
      </div>
    </div>
  );
}
