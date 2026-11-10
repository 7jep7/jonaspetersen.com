import { useEffect, useRef, useState } from "react";

// Career as a sensor trace: noisy signal, one spike per milestone.
// The time axis is piecewise: 2018-2025 compressed, 2026 stretched.
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
  external?: boolean;
  years: string;
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
  { id: "gemma", label: "Gemmaverse", href: "https://deepmind.google/models/gemma/gemmaverse/forgis/#:~:text=Hyperion%20builds%20representations,Head%20of%20Research%2C%20Forgis", x: 810, side: "top", external: true, year: "'26" },
];

const ticks = [
  { x: 20, label: "'18" },
  { x: 206, label: "'22" },
  { x: 292, label: "'23" },
  { x: 400, label: "'25" },
  { x: 452, label: "'26" },
];

// Deterministic value noise, so the signal wanders like a real sensor
// instead of repeating, and server and browser draw the same line.
const rand = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const vn = (x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return (rand(i) * (1 - u) + rand(i + 1) * u) * 2 - 1;
};
const noise = (x: number) => 1.6 * vn(x / 40 + 200) + 2 * vn(x / 9) + 1.1 * vn(x / 3.1 + 50) + 0.6 * vn(x / 1.3 + 100);

// A spike rises fast and rings down, with a slightly different height each time.
const SPIKE = 34;
const spike = (x: number, at: number, sign: number) => {
  const d = x - at;
  if (d < -12 || d > 30) return 0;
  const shape = d < 0 ? Math.exp(-(d * d) / 14) : Math.exp(-d / 5) * Math.cos(d * 0.35);
  return sign * SPIKE * (0.8 + 0.2 * rand(at)) * shape;
};
const signal = (x: number) => {
  let v = noise(x);
  for (const e of events) v += spike(x, e.x, e.side === "top" ? -1 : 1);
  return v;
};

// Path plus the arc length at each sample, so a pulse can stop at a spike.
function polyline(points: [number, number][]) {
  let d = "";
  let len = 0;
  const at: number[] = [];
  points.forEach(([x, y], i) => {
    if (i) len += Math.hypot(x - points[i - 1][0], y - points[i - 1][1]);
    at.push(len);
    d += `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return { d, len, at };
}

const range = (from: number, to: number, step = 2) => {
  const xs: number[] = [];
  for (let x = from; x <= to; x += step) xs.push(x);
  return xs;
};

// Desktop: time runs left to right.
const past = polyline(range(0, NOW).map((x) => [x, BASE + signal(x)]));
const futurePath = polyline(range(NOW, W).map((x) => [x, BASE + signal(x)])).d;
const band = `M${NOW},${BASE}L${W},${BASE - 26}L${W},${BASE + 26}Z`;
const pct = (x: number) => `${(x / W) * 100}%`;

// Phones: the same signal turned upright. Time runs bottom to top, top spikes point right.
const K = 0.85; // px per time unit
const FORE = 51; // forecast zone above "now": 60 time units
const MW = 80; // trace column width
const CX = MW / 2;
const HS = 0.7; // horizontal scale of the signal
const OLD = 400; // before Forgis the phone axis is compressed further
const K_OLD = 0.55;
const ty = (x: number) => FORE + (NOW - Math.max(x, OLD)) * K + Math.max(OLD - x, 0) * K_OLD;
const VH = ty(0);
const vPast = polyline(range(0, NOW).map((x) => [CX - signal(x) * HS, ty(x)]));
const vFuture = polyline(range(NOW, NOW + FORE / K).map((x) => [CX - signal(x) * HS, ty(x)])).d;

// The trace runs in from the screen edge and out again, so it never stops mid-air.
// Desktop: straight extensions left and right, drawn 1:1 in px.
const EXT = 2400;
const DS = 0.85; // px per time unit in the desktop strip (848 px for 1000 units)
const leftExt = polyline(range(0, EXT, 3).map((px) => [px, BASE + noise((px - EXT) / DS)])).d;
const rightExt = polyline(range(0, EXT, 3).map((px) => [px, BASE + signal(W + px / DS)])).d;

// Phones: the trace sweeps in from the bottom left and leaves to the top right.
type Pt = [number, number];
function bend(p0: Pt, p1: Pt, p2: Pt, n: number, sig: (s: number, len: number) => number) {
  const base: Pt[] = [];
  const tan: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    base.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]);
    const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const m = Math.hypot(dx, dy) || 1;
    tan.push([dx / m, dy / m]);
  }
  const arc = [0];
  for (let i = 1; i <= n; i++) arc.push(arc[i - 1] + Math.hypot(base[i][0] - base[i - 1][0], base[i][1] - base[i - 1][1]));
  const len = arc[n];
  // Offset along the normal, the same way the upright trace offsets along x.
  return polyline(base.map(([x, y], i): Pt => {
    const off = -sig(arc[i], len) * HS;
    return [x - tan[i][1] * off, y + tan[i][0] * off];
  })).d;
}
const LEADW = 640;
const LEADH = 96;
const EXW = 640;
const EXH = 72;
const vLead = bend([0, LEADH - 10], [LEADW, LEADH - 10], [LEADW, 0], 700, (a, len) => noise(-(len - a) / K_OLD));
const vExit = bend([0, EXH], [0, 10], [EXW, 10], 700, (a) => signal(NOW + FORE / K + a / K));

// Pulse targets: the arc length where each spike peaks.
const targets = (line: { at: number[] }) =>
  events.map((e) => ({ id: e.id, len: line.at[Math.round(e.x / 2)] }));
const pastTargets = targets(past);
const vTargets = targets(vPast);

const pill =
  "whitespace-nowrap rounded-full border bg-gray-900 px-2 py-0.5 text-[11px] leading-4 " +
  "transition-[color,border-color,box-shadow] duration-500 hover:border-orange-500 hover:text-orange-400 " +
  "focus-visible:border-orange-500 focus-visible:outline-none career-fade";
const lit = (on: boolean) =>
  on ? "border-orange-500 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.45)]" : "border-gray-700 text-gray-300";

const PULSE = 46; // length of the bright segment

// Every few seconds a short pulse runs along the visible trace and lights up
// the milestone where it stops. Off for reduced motion.
function usePulses(ref: React.RefObject<SVGPathElement>, stops: { id: string; len: number }[], total: number) {
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    const path = ref.current;
    if (!path || !path.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let last = "";
    path.style.strokeDasharray = `${PULSE} ${total + PULSE}`;
    const fire = () => {
      if (!alive) return;
      if (document.hidden || !path.getClientRects().length) {
        timer = setTimeout(fire, 3000);
        return;
      }
      const pool = stops.filter((s) => s.id !== last);
      const stop = pool[Math.floor(Math.random() * pool.length)];
      last = stop.id;
      const run = path.animate(
        [
          { strokeDashoffset: PULSE, opacity: 0 },
          { strokeDashoffset: PULSE - stop.len * 0.1, opacity: 1, offset: 0.1 },
          { strokeDashoffset: PULSE - stop.len, opacity: 1 },
        ],
        { duration: 700 + stop.len * 0.9, easing: "cubic-bezier(0.45, 0, 0.35, 1)", fill: "forwards" },
      );
      run.onfinish = () => {
        if (!alive) return;
        path.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" });
        setFlash(stop.id);
        setTimeout(() => alive && setFlash(null), 1500);
        timer = setTimeout(fire, 3500 + Math.random() * 3500);
      };
    };
    timer = setTimeout(fire, 2600);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [ref, stops, total]);
  return flash;
}

const pulseProps = {
  fill: "none",
  stroke: "#fed7aa",
  strokeWidth: 2.5,
  strokeLinecap: "round" as const,
  style: { opacity: 0, filter: "drop-shadow(0 0 3px #fb923c)" },
};

export function CareerTrace() {
  const [active, setActive] = useState<string | null>(null);
  const pulse = useRef<SVGPathElement>(null);
  const vPulse = useRef<SVGPathElement>(null);
  const flash = usePulses(pulse, pastTargets, past.len);
  const vFlash = usePulses(vPulse, vTargets, vPast.len);
  const on = (id: string) => active === id || flash === id || vFlash === id;

  const linkProps = (href: string, external?: boolean) =>
    external ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
  const hover = (id: string) => ({
    onMouseEnter: () => setActive(id),
    onMouseLeave: () => setActive(null),
    onFocus: () => setActive(id),
    onBlur: () => setActive(null),
  });

  return (
    <div className="mt-10 lg:mt-6">
      <div className="font-mono text-[11px] uppercase tracking-widest text-gray-300 mb-3 lg:mb-1">Anomaly log</div>

      {/* Phones */}
      <div className="lg:hidden relative" style={{ height: VH, marginTop: EXH - 24, marginBottom: LEADH + 8 }}>
        <svg width={EXW} height={EXH} className="absolute pointer-events-none" style={{ left: "50%", top: -EXH }} aria-hidden="true">
          <g className="career-fade" style={{ animationDelay: "1.2s" }}>
            <path d={vExit} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4"
              className="text-orange-400/80 career-flow" />
          </g>
        </svg>
        <svg width={LEADW} height={LEADH} className="absolute pointer-events-none" style={{ left: `calc(50% - ${LEADW}px)`, top: VH }} aria-hidden="true">
          <path d={vLead} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-orange-500 career-fade" />
        </svg>
        <svg width={MW} height={VH} className="absolute top-0" style={{ left: `calc(50% - ${CX}px)` }} aria-hidden="true">
          <g className="career-fade" style={{ animationDelay: "1.2s" }}>
            <path d={vFuture} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4"
              className="text-orange-400/80 career-flow" />
          </g>
          <line x1={CX - 30} x2={CX + 30} y1={FORE} y2={FORE} stroke="currentColor" strokeWidth="1" className="text-gray-600" />
          {periods.map((p) => {
            const x = p.side === "top" ? CX + 31 : CX - 31;
            const tip = p.side === "top" ? -4 : 4;
            return (
              <path key={p.label} d={`M${x + tip},${ty(p.to)}H${x}V${ty(p.from)}H${x + tip}`} fill="none"
                stroke="currentColor" strokeWidth="1" className="text-gray-600 career-fade" />
            );
          })}
          {events.map((e) => {
            const right = e.side === "top";
            return (
              <line key={e.id} x1={right ? CX + SPIKE * HS + 2 : CX - SPIKE * HS - 2} x2={right ? MW : 0}
                y1={ty(e.x)} y2={ty(e.x)} stroke="currentColor" strokeWidth="1" strokeDasharray="1 3"
                className={`career-fade transition-colors duration-500 ${on(e.id) ? "text-orange-400" : "text-gray-600"}`} />
            );
          })}
          <clipPath id="career-wipe-v">
            <rect width={MW} height={VH} className="career-wipe-v" />
          </clipPath>
          <path d={vPast.d} clipPath="url(#career-wipe-v)" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="text-orange-500" />
          <path ref={vPulse} d={vPast.d} {...pulseProps} />
        </svg>
        <span className="absolute font-mono text-[10px] uppercase tracking-widest text-gray-500 -translate-y-1/2"
          style={{ right: `calc(50% + ${CX - 10}px)`, top: FORE }}>now</span>
        <span className="absolute font-mono text-[11px] text-gray-500 career-fade" style={{ left: `calc(50% + 30px)`, top: 6, animationDelay: "1.4s" }}
          title="We forecast machine failures for a living. Our own forecast has wide error bars.">?</span>
        {[...events.map((e) => ({ key: e.id, label: e.label, href: e.href, external: e.external, x: e.x, side: e.side, id: e.id })),
          ...periods.map((p) => ({ key: p.label, label: p.label, href: p.href, external: p.external, x: (p.from + p.to) / 2, side: p.side, id: "" }))]
          .map((b) => (
            <a key={b.key} {...linkProps(b.href, b.external)}
              className={`${pill} ${lit(!!b.id && on(b.id))} absolute -translate-y-1/2 ${b.side === "top" ? "text-left" : "text-right"}`}
              // On very narrow screens a long label wraps instead of running off the edge.
              style={{ [b.side === "top" ? "left" : "right"]: `calc(50% + ${CX + 4}px)`, top: ty(b.x), animationDelay: `${(b.x / NOW) * 1.2}s`,
                whiteSpace: "normal", width: "max-content", maxWidth: `calc(50vw - ${CX + 16}px)` }}>
              {b.label}
            </a>
          ))}
        {/* Year ticks, each on the side away from the nearest badge */}
        {ticks.map((t, i) => (
          <span key={t.label} className="absolute -translate-y-1/2 font-mono text-[10px] text-gray-500"
            style={{ [i % 2 ? "left" : "right"]: "calc(50% + 12px)", top: ty(t.x) }}>
            {t.label}
          </span>
        ))}
      </div>
      <div className="text-right font-mono text-[10px] text-gray-500 lg:hidden">Not to scale. 2026 was long.</div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <div>
          <div className="relative" style={{ height: H }}>
            <svg width={EXT} height={H} className="absolute top-0 pointer-events-none" style={{ right: "100%" }} aria-hidden="true">
              <path d={leftExt} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-orange-500 career-fade" />
            </svg>
            <svg width={EXT} height={H} className="absolute top-0 pointer-events-none" style={{ left: "100%" }} aria-hidden="true">
              <g className="career-fade" style={{ animationDelay: "1.2s" }}>
                <path d={rightExt} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4"
                  className="text-orange-400/80 career-flow" />
              </g>
            </svg>
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
                  className={`career-fade transition-colors duration-500 ${on(e.id) ? "text-orange-400" : "text-gray-600"}`}
                  style={{ animationDelay: `${(e.x / NOW) * 1.2}s` }} />
              ))}
              <clipPath id="career-wipe">
                <rect width={NOW} height={H} className="career-wipe" />
              </clipPath>
              <path d={past.d} clipPath="url(#career-wipe)" fill="none" stroke="currentColor" strokeWidth="1.5"
                vectorEffect="non-scaling-stroke" className="text-orange-500" />
              <path ref={pulse} d={past.d} {...pulseProps} />
              {/* Forecast cone, fading out so it has no hard edge */}
              <linearGradient id="career-cone" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#f97316" stopOpacity="0.14" />
                <stop offset="1" stopColor="#f97316" stopOpacity="0" />
              </linearGradient>
              <path d={band} fill="url(#career-cone)" className="career-fade" style={{ animationDelay: "1.2s" }} />
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
              <a key={p.label} {...linkProps(p.href, p.external)} className={`${pill} ${lit(false)} absolute -translate-x-1/2`}
                style={{ left: pct(p.labelX ?? (p.from + p.to) / 2), [p.side]: 26, animationDelay: `${(p.to / NOW) * 1.2}s` }}>
                {p.label}
              </a>
            ))}
            {events.map((e) => (
              <a key={e.id} {...linkProps(e.href, e.external)} {...hover(e.id)}
                className={`${pill} ${lit(flash === e.id || vFlash === e.id)} absolute -translate-x-1/2`}
                style={{ left: pct(e.x), [e.side]: e.inner ? 26 : 0, animationDelay: `${(e.x / NOW) * 1.2}s` }}>
                {e.label}
              </a>
            ))}
            <span className={`${pill} ${lit(false)} absolute -translate-x-1/2 cursor-help`} tabIndex={0}
              title="We forecast machine failures for a living. Our own forecast has wide error bars."
              style={{ left: pct(955), top: 0, animationDelay: "1.4s" }}>
              ?
            </span>
            <span className="absolute -translate-x-1/2 font-mono text-[10px] uppercase tracking-widest text-gray-500"
              style={{ left: pct(NOW), bottom: 0 }}>
              now
            </span>
            {ticks.map((t) => (
              <span key={t.label} className="absolute -translate-x-1/2 font-mono text-[10px] text-gray-500"
                style={{ left: pct(t.x), bottom: -14 }}>
                {t.label}
              </span>
            ))}
          </div>
          <div className="h-4" />
        </div>
        <div className="text-right font-mono text-[10px] text-gray-500 mt-1">x-axis not to scale. 2026 was long.</div>
      </div>
    </div>
  );
}
