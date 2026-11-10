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

// Phones: the same trace, rotated. Time runs bottom to top, newest at the top.
const FORE = 44; // forecast zone above "now"
const ROW = 32;
const VW = 52;
const VX = 48; // left edge of the trace column
const VBASE = 12;
const VSPIKE = 24;
const VH = FORE + rows.length * ROW;
const rowY = (i: number) => FORE + i * ROW + ROW / 2;

function vTrace(from: number, to: number) {
  let d = "";
  for (let y = from; y <= to; y += 2) {
    let v = noise(y * 1.3);
    rows.forEach((r, i) => {
      const dy = y - rowY(i);
      v += r.span ? 7 * Math.exp(-(dy * dy) / 60) : VSPIKE * Math.exp(-(dy * dy) / 10);
    });
    d += `${y === from ? "M" : "L"}${(VBASE + v).toFixed(1)},${y}`;
  }
  return d;
}

const vPast = vTrace(FORE, VH);
const vFuture = vTrace(0, FORE);
const vBand = `M${VBASE},${FORE}L${VBASE - 10},0L${VBASE + 26},0Z`;

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
      <div className="md:hidden relative" style={{ height: VH }}>
        <svg width={VW} height={VH} className="absolute top-0" style={{ left: VX }} aria-hidden="true">
          <path d={vBand} className="fill-orange-500/10 career-fade" style={{ animationDelay: "1.2s" }} />
          <g className="career-fade" style={{ animationDelay: "1.2s" }}>
            <path d={vFuture} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4"
              className="text-orange-400/80 career-flow" />
          </g>
          <line x1={2} x2={VW - 6} y1={FORE} y2={FORE} stroke="currentColor" strokeWidth="1" className="text-gray-600" />
          {rows.map((r, i) => !r.span && (
            <line key={r.key} x1={VBASE + VSPIKE + 2} x2={VW} y1={rowY(i)} y2={rowY(i)} stroke="currentColor"
              strokeWidth="1" strokeDasharray="1 3" className="text-gray-600 career-fade" />
          ))}
          <clipPath id="career-wipe-v">
            <rect width={VW} height={VH} className="career-wipe-v" />
          </clipPath>
          <path d={vPast} clipPath="url(#career-wipe-v)" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="text-orange-500" />
        </svg>
        <span className="absolute w-10 text-right font-mono text-[10px] uppercase tracking-widest text-gray-500"
          style={{ left: 0, top: FORE - 6 }}>now</span>
        <span className="absolute font-mono text-[11px] text-gray-500 career-fade" style={{ left: VX + VW + 8, top: 4, animationDelay: "1.4s" }}
          title="We forecast machine failures for a living. Our own forecast has wide error bars.">?</span>
        {rows.map((r, i) => (
          <div key={r.key}>
            {r.year !== rows[i - 1]?.year && (
              <span className="absolute w-10 -translate-y-1/2 text-right font-mono text-[10px] text-gray-500"
                style={{ left: 0, top: rowY(i) }}>{r.year}</span>
            )}
            <a {...linkProps(r.href, r.external)} className={`${pill} absolute -translate-y-1/2`}
              style={{ left: VX + VW + 8, top: rowY(i), animationDelay: `${1.2 - i * 0.08}s` }}>
              {r.label}
            </a>
          </div>
        ))}
      </div>
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
