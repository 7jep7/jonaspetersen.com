import { useEffect, useRef, useState } from "react";

// Career as a sensor trace: flat signal, one spike per milestone.
// The x-axis is piecewise: 2018-2025 compressed, 2026 stretched.
const W = 1000;
const H = 140;
const BASE = 82; // baseline y
const NOW = 860;

type Side = "top" | "bottom";

interface Period {
  label: string;
  href: string;
  from: number;
  to: number;
  side: Side;
}

interface Event {
  id: string;
  label: string;
  href: string;
  x: number;
  side: Side;
  external?: boolean;
}

const periods: Period[] = [
  { label: "Imperial", href: "#about", from: 20, to: 150, side: "top" },
  { label: "Cambridge", href: "#wildfire", from: 156, to: 226, side: "bottom" },
  { label: "Co-founded K2", href: "#k2", from: 232, to: 330, side: "top" },
];

const events: Event[] = [
  { id: "forgis", label: "Forgis", href: "#forgis", x: 372, side: "bottom" },
  { id: "icml", label: "5 × ICML", href: "#publications", x: 480, side: "top" },
  { id: "accel", label: "DeepMind Accelerator", href: "https://deepmind.google/accelerators/robotics/", x: 560, side: "bottom", external: true },
  { id: "grant", label: "$300k compute", href: "https://lnkd.in/p/eKv4q8Zp", x: 660, side: "top", external: true },
  { id: "neurips", label: "5 × NeurIPS", href: "#publications", x: 725, side: "bottom" },
  { id: "gemma", label: "Gemmaverse", href: "https://deepmind.google/models/gemma/gemmaverse/forgis/", x: 800, side: "top", external: true },
];

const ticks = [
  { x: 20, label: "'18" },
  { x: 156, label: "'22" },
  { x: 232, label: "'23" },
  { x: 330, label: "'25" },
  { x: 420, label: "'26" },
];

// Small deterministic noise so the baseline reads as a real signal.
const noise = (x: number) =>
  1.6 * Math.sin(x * 0.21) + 1.1 * Math.sin(x * 0.53 + 1.7) + 0.7 * Math.sin(x * 1.37 + 0.4);

const SPIKE = 34;
const spike = (x: number, at: number, sign: number) => {
  const d = x - at;
  return sign * SPIKE * Math.exp(-(d * d) / 18);
};

function trace(from: number, to: number) {
  let d = "";
  for (let x = from; x <= to; x += 2) {
    let v = noise(x);
    for (const e of events) v += spike(x, e.x, e.side === "top" ? -1 : 1);
    d += `${x === from ? "M" : "L"}${x},${(BASE + v).toFixed(1)}`;
  }
  return d;
}

const pastPath = trace(0, NOW);
const futurePath = trace(NOW, W);
const band = `M${NOW},${BASE}L${W},${BASE - 26}L${W},${BASE + 26}Z`;
const pct = (x: number) => `${(x / W) * 100}%`;

const badge =
  "absolute -translate-x-1/2 whitespace-nowrap rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 " +
  "text-[11px] leading-4 text-gray-300 transition-colors hover:border-orange-500 hover:text-orange-400 " +
  "focus-visible:border-orange-500 focus-visible:outline-none career-fade";

export function CareerTrace() {
  const [active, setActive] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // On narrow screens the strip scrolls; start at "now".
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const linkProps = (href: string, external?: boolean) =>
    external ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };

  return (
    <div className="mt-6">
      <div className="font-mono text-[10px] uppercase tracking-widest text-gray-500 mb-1">Anomaly log</div>
      <div ref={scroller} className="overflow-x-auto overflow-y-hidden [scrollbar-width:none]">
        <div className="relative min-w-[760px]" style={{ height: H }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
            {/* Periods: brackets on the axis */}
            {periods.map((p) => {
              const y = p.side === "top" ? BASE - 12 : BASE + 12;
              const tip = p.side === "top" ? 4 : -4;
              return (
                <path key={p.label} d={`M${p.from},${y + tip}V${y}H${p.to}V${y + tip}`} fill="none"
                  stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke"
                  className="text-gray-600 career-fade" style={{ animationDelay: `${(p.to / NOW) * 1.2}s` }} />
              );
            })}
            {/* Connectors from spike tips to badges */}
            {events.map((e) => (
              <line key={e.id} x1={e.x} x2={e.x}
                y1={e.side === "top" ? 22 : H - 22} y2={e.side === "top" ? BASE - SPIKE - 2 : BASE + SPIKE + 2}
                stroke="currentColor" strokeWidth="1" strokeDasharray="1 3" vectorEffect="non-scaling-stroke"
                className={`career-fade transition-colors ${active === e.id ? "text-orange-400" : "text-gray-600"}`}
                style={{ animationDelay: `${(e.x / NOW) * 1.2}s` }} />
            ))}
            <clipPath id="career-wipe">
              <rect width={NOW} height={H} className="career-wipe" />
            </clipPath>
            <path d={pastPath} clipPath="url(#career-wipe)" fill="none" stroke="currentColor" strokeWidth="1.5"
              vectorEffect="non-scaling-stroke" className="text-orange-500" />
            <path d={band} className="fill-orange-500/10 career-fade" style={{ animationDelay: "1.2s" }} />
            <g className="career-fade" style={{ animationDelay: "1.2s" }}>
              <path d={futurePath} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke" className="text-orange-400/80 career-flow" />
            </g>
            <line x1={NOW} x2={NOW} y1={BASE - 40} y2={BASE + 40} stroke="currentColor" strokeWidth="1"
              vectorEffect="non-scaling-stroke" className="text-gray-600" />
            {/* Axis ticks */}
            {ticks.map((t) => (
              <line key={t.label} x1={t.x} x2={t.x} y1={H - 4} y2={H} stroke="currentColor" strokeWidth="1"
                vectorEffect="non-scaling-stroke" className="text-gray-700" />
            ))}
          </svg>

          {periods.map((p) => (
            <a key={p.label} {...linkProps(p.href)} className={badge}
              style={{ left: pct((p.from + p.to) / 2), [p.side]: p.side === "top" ? 26 : 18, animationDelay: `${(p.to / NOW) * 1.2}s` }}>
              {p.label}
            </a>
          ))}
          {events.map((e) => (
            <a key={e.id} {...linkProps(e.href, e.external)} className={badge}
              onMouseEnter={() => setActive(e.id)} onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(e.id)} onBlur={() => setActive(null)}
              style={{ left: pct(e.x), [e.side]: 0, animationDelay: `${(e.x / NOW) * 1.2}s` }}>
              {e.label}
            </a>
          ))}
          <span className={`${badge} cursor-help`} tabIndex={0}
            title="We forecast machine failures for a living. Our own forecast has wide error bars."
            style={{ left: pct(955), top: 0, animationDelay: "1.4s" }}>
            ?
          </span>
          <span className="absolute -translate-x-1/2 font-mono text-[10px] uppercase tracking-widest text-gray-500"
            style={{ left: pct(NOW), bottom: 0 }}>
            now
          </span>
          {ticks.map((t) => (
            <span key={t.label} className="absolute -translate-x-1/2 font-mono text-[10px] text-gray-600"
              style={{ left: pct(t.x), bottom: -14 }}>
              {t.label}
            </span>
          ))}
        </div>
        <div className="h-4 min-w-[760px]" />
      </div>
      <div className="text-right font-mono text-[10px] text-gray-600 mt-1">x-axis not to scale. 2026 was long.</div>
    </div>
  );
}
