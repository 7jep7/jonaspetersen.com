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
  labelX?: number; // badge centre, when the bracket centre collides
  years: string;
  external?: boolean;
}

interface Event {
  id: string;
  label: string;
  href: string;
  x: number;
  side: Side;
  external?: boolean;
  inner?: boolean; // badge sits in the inner row, close to the line
  year: string;
}

const periods: Period[] = [
  { label: "Imperial · Dean's List", href: "#wildfire", from: 20, to: 200, side: "top", years: "'18–'22" },
  { label: "Cambridge · Distinction", href: "/cv.pdf", external: true, from: 206, to: 286, side: "bottom", years: "'22–'23" },
  { label: "Co-founded K2", href: "#k2", from: 292, to: 400, side: "top", labelX: 362, years: "'23–'25" },
];

const events: Event[] = [
  { id: "bcg", label: "BCG offer · declined", href: "#k2", x: 289, side: "top", year: "'23" },
  { id: "forgis", label: "Forgis", href: "#forgis", x: 412, side: "bottom", year: "'25" },
  { id: "eth", label: "ETH · Siegwart", href: "https://asl.ethz.ch/", x: 478, side: "top", external: true, inner: true, year: "'26" },
  { id: "icml", label: "5 × ICML", href: "#publications", x: 548, side: "top", year: "'26" },
  { id: "accel", label: "DeepMind Accelerator", href: "https://deepmind.google/accelerators/robotics/", x: 615, side: "bottom", external: true, year: "'26" },
  { id: "grant", label: "$300k compute", href: "https://lnkd.in/p/eKv4q8Zp", x: 685, side: "top", external: true, year: "'26" },
  { id: "neurips", label: "5 × NeurIPS", href: "#publications", x: 750, side: "bottom", year: "'26" },
  { id: "gemma", label: "Gemmaverse", href: "https://deepmind.google/models/gemma/gemmaverse/forgis/", x: 810, side: "top", external: true, year: "'26" },
];

const ticks = [
  { x: 20, label: "'18" },
  { x: 206, label: "'22" },
  { x: 292, label: "'23" },
  { x: 400, label: "'25" },
  { x: 452, label: "'26" },
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

const pill =
  "whitespace-nowrap rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 " +
  "text-[11px] leading-4 text-gray-300 transition-colors hover:border-orange-500 hover:text-orange-400 " +
  "focus-visible:border-orange-500 focus-visible:outline-none career-fade";
const badge = "absolute -translate-x-1/2 " + pill;

// Phones get the same log top to bottom, newest first.
const rows = [
  ...events.map((e) => ({ key: e.id, label: e.label, href: e.href, external: e.external, at: e.x, year: e.year, span: false })),
  ...periods.map((p) => ({ key: p.label, label: p.label, href: p.href, external: p.external, at: p.from, year: p.years, span: true })),
].sort((a, b) => b.at - a.at);

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
    <div className="mt-12 md:mt-6">
      <div className="font-mono text-[10px] uppercase tracking-widest text-gray-500 mb-3 md:mb-1">Anomaly log</div>
      <ol className="md:hidden">
        <li className="flex gap-3">
          <span className="w-12 shrink-0 text-right font-mono text-[10px] text-gray-500 pt-1">next</span>
          <span className="w-0 shrink-0 border-l border-dashed border-orange-400/80" />
          <span className="pl-3 pb-3 font-mono text-[11px] text-gray-500"
            title="We forecast machine failures for a living. Our own forecast has wide error bars.">?</span>
        </li>
        {rows.map((r, i) => (
          <li key={r.key} className="flex gap-3">
            <span className="w-12 shrink-0 text-right font-mono text-[10px] text-gray-500 pt-1.5">
              {r.year !== rows[i - 1]?.year && r.year}
            </span>
            <span className="relative w-px shrink-0 bg-orange-500/70">
              <span className={`absolute left-1/2 top-[11px] h-[7px] w-[7px] -translate-x-1/2 rounded-full ${r.span ? "border border-orange-500 bg-gray-900" : "bg-orange-500"}`} />
            </span>
            <span className="pl-3 pb-2">
              <a {...linkProps(r.href, r.external)} className={`${pill} inline-block`} style={{ animationDelay: `${i * 0.04}s` }}>
                {r.label}
              </a>
            </span>
          </li>
        ))}
      </ol>
      <div className="text-right font-mono text-[10px] text-gray-600 mt-2 md:hidden">Not to scale. 2026 was long.</div>
      <div className="hidden md:block">
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
                y1={e.side === "top" ? (e.inner ? 42 : 22) : H - (e.inner ? 42 : 22)} y2={e.side === "top" ? BASE - SPIKE - 2 : BASE + SPIKE + 2}
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
            <a key={p.label} {...linkProps(p.href, p.external)} className={badge}
              style={{ left: pct(p.labelX ?? (p.from + p.to) / 2), [p.side]: 26, animationDelay: `${(p.to / NOW) * 1.2}s` }}>
              {p.label}
            </a>
          ))}
          {events.map((e) => (
            <a key={e.id} {...linkProps(e.href, e.external)} className={badge}
              onMouseEnter={() => setActive(e.id)} onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(e.id)} onBlur={() => setActive(null)}
              style={{ left: pct(e.x), [e.side]: e.inner ? 26 : 0, animationDelay: `${(e.x / NOW) * 1.2}s` }}>
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
    </div>
  );
}
