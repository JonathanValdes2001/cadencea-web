import React, { useId } from 'react';
import { generateCover, type CoverKind, type Motif, type PaletteName } from '@/lib/v2-demo/cover';

const ROUNDED = { none: '', sm: 'rounded-sm', md: 'rounded-md', full: 'rounded-full' } as const;

/**
 * Generated cover art and avatars (WEB-V2-SPEC §3.4): inline SVG from a seed, so
 * no image is fetched and the server and browser draw the same picture.
 * Decorative inside cards (the title sits next to it); labelled on item pages.
 */
export default function CoverArt({
  seed,
  kind,
  palette,
  motif,
  title,
  decorative = false,
  rounded = 'md',
  idPrefix,
  className = '',
}: {
  seed: string;
  kind: CoverKind;
  palette?: PaletteName;
  motif?: Motif;
  /** Names the image ("Cover art for {title}") and gives avatars their initials. */
  title?: string;
  decorative?: boolean;
  rounded?: keyof typeof ROUNDED;
  /** Overrides the generated id base (seed + position) where useId isn't available. */
  idPrefix?: string;
  className?: string;
}) {
  const reactId = useId();
  const base = (idPrefix ?? `cover${reactId}`).replace(/[^a-zA-Z0-9_-]/g, '');
  const spec = generateCover({ seed, kind, palette, motif, title });
  const { bgFrom, bgTo, ink, highlight } = spec.colors;
  const paint = (p: 'ink' | 'highlight' | 'none') => (p === 'ink' ? ink : p === 'highlight' ? highlight : 'none');
  const label = kind === 'avatar' ? title ?? seed : `Cover art for ${title ?? seed}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 400"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
      className={`block aspect-square h-auto w-full ${ROUNDED[rounded]} ${className}`}
    >
      <defs>
        {spec.gradient.kind === 'linear' ? (
          <linearGradient
            id={`${base}-bg`}
            x1={spec.gradient.x1}
            y1={spec.gradient.y1}
            x2={spec.gradient.x2}
            y2={spec.gradient.y2}
          >
            <stop offset="0" stopColor={bgFrom} />
            <stop offset="1" stopColor={bgTo} />
          </linearGradient>
        ) : (
          <radialGradient id={`${base}-bg`} cx={spec.gradient.cx} cy={spec.gradient.cy} r={spec.gradient.r}>
            <stop offset="0" stopColor={bgTo} />
            <stop offset="1" stopColor={bgFrom} />
          </radialGradient>
        )}
        {spec.grain && (
          <pattern id={`${base}-grain`} width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="1" height="1" fill={highlight} />
          </pattern>
        )}
      </defs>
      <rect width="400" height="400" fill={`url(#${base}-bg)`} />
      {spec.shapes.map((shape, i) => {
        if (shape.type === 'rect') {
          return (
            <rect
              key={i}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              rx={shape.rx}
              fill={paint(shape.fill)}
              opacity={shape.opacity}
              transform={shape.rotate ? `rotate(${shape.rotate} 200 200)` : undefined}
            />
          );
        }
        if (shape.type === 'circle') {
          return (
            <circle
              key={i}
              cx={shape.cx}
              cy={shape.cy}
              r={shape.r}
              fill={paint(shape.fill)}
              stroke={paint(shape.stroke)}
              strokeWidth={shape.strokeWidth}
              opacity={shape.opacity}
            />
          );
        }
        return (
          <path
            key={i}
            d={shape.d}
            fill="none"
            stroke={paint(shape.stroke)}
            strokeWidth={shape.strokeWidth}
            strokeLinecap="round"
            opacity={shape.opacity}
          />
        );
      })}
      {spec.monogram && (
        <text
          x="200"
          y="208"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="140"
          fontWeight="700"
          fill={highlight}
        >
          {spec.monogram}
        </text>
      )}
      {spec.grain && <rect width="400" height="400" fill={`url(#${base}-grain)`} opacity="0.06" />}
    </svg>
  );
}
