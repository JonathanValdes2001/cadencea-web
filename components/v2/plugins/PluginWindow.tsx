import React from 'react';

/*
 * Code-built pictures for the plugins pages (/vst-plugins, the home "What's next"
 * band, the /software card). They are deliberately generic: a window frame, knobs
 * and a meter, with no name, label or number, because no Cadencea plugin exists
 * to show yet. Decorative only: callers put them in an aria-hidden container.
 */

const KNOB_SWEEP = 270; // degrees of travel, from 7:30 to 4:30 on the dial

/** A point on a circle around (24, 24), `deg` clockwise from straight up. */
function polar(radius: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [24 + radius * Math.sin(rad), 24 - radius * Math.cos(rad)];
}

/** An SVG arc on the dial from `fromDeg` to `toDeg` (both clockwise from straight up). */
function arc(radius: number, fromDeg: number, toDeg: number): string {
  const [x1, y1] = polar(radius, fromDeg);
  const [x2, y2] = polar(radius, toDeg);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** One dial at `value` (0 to 1). */
function Knob({ value, className = '' }: { value: number; className?: string }) {
  const start = -KNOB_SWEEP / 2;
  const at = start + KNOB_SWEEP * value;
  const [x1, y1] = polar(6, at);
  const [x2, y2] = polar(13, at);
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path d={arc(20, start, KNOB_SWEEP / 2)} stroke="rgba(255,255,255,0.14)" strokeWidth="3" strokeLinecap="round" />
      <path d={arc(20, start, at)} stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.22)" />
      <line x1={x1.toFixed(2)} y1={y1.toFixed(2)} x2={x2.toFixed(2)} y2={y2.toFixed(2)} stroke="#EDE9FE" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const KNOB_VALUES = [0.35, 0.7, 0.55];

/** Level bars, fixed so the picture is the same on every render. */
const METER = [0.3, 0.52, 0.4, 0.74, 0.62, 0.9, 0.7, 0.48, 0.66, 0.36, 0.58, 0.28];

/** A small row of dials, for cards. */
export function PluginKnobs({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      {KNOB_VALUES.map((value) => (
        <Knob key={value} value={value} className="h-14 w-14" />
      ))}
    </div>
  );
}

/** An abstract plugin window: title-bar dots, three dials and a level meter. */
export default function PluginWindow({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden rounded-lg border border-white/10 bg-showroom-to text-dark-text shadow-brand-glow ring-1 ring-white/5 ${className}`}
    >
      <div className="flex h-9 items-center border-b border-white/10 bg-white/[0.03] px-3">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </span>
      </div>
      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-3 gap-4">
          {KNOB_VALUES.map((value) => (
            <div key={value} className="flex flex-col items-center gap-3">
              <Knob value={value} className="h-16 w-16 sm:h-20 sm:w-20" />
              <span className="h-1.5 w-10 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex h-14 items-end gap-1.5 rounded-md border border-white/10 bg-white/[0.03] p-3">
          {METER.map((level, i) => (
            <span
              key={i}
              className={`flex-1 rounded-sm ${level > 0.8 ? 'bg-brand-300' : 'bg-brand-400/70'}`}
              style={{ height: `${Math.round(level * 100)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
