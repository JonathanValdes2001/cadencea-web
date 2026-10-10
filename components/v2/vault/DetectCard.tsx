import React from 'react';
import { Check, Waveform } from '@/components/ui/Icons';

type Level = 'High' | 'Medium' | 'Low';

const FILLED: Record<Level, number> = { High: 3, Medium: 2, Low: 1 };

/** DETECT-SPEC's three-segment meter: the level in words, never a raw score (DECISIONS.md D4). */
function ConfidenceMeter({ level }: { level: Level }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-dark-muted">
      <span className="inline-flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-2.5 w-1.5 rounded-sm ${i < FILLED[level] ? 'bg-brand-400' : 'bg-white/15'}`} />
        ))}
      </span>
      {level} confidence
    </span>
  );
}

function Field({
  label,
  value,
  level,
  source,
  alternates,
}: {
  label: string;
  value: string;
  level: Level;
  source: string;
  alternates: string;
}) {
  return (
    <div className="border-t border-white/10 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-dark-muted">{label}</span>
        <span className="text-xs text-dark-muted">Current: —</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-xl font-semibold tabular-nums text-dark-text">{value}</span>
        <ConfidenceMeter level={level} />
      </div>
      <p className="mt-1 text-xs text-brand-300">{source}</p>
      <p className="mt-1 text-xs text-dark-muted">{alternates}</p>
      <div className="mt-3 flex gap-2">
        <span className="inline-flex h-8 items-center rounded-sm bg-accent px-3 text-xs font-semibold text-white">Accept</span>
        <span className="inline-flex h-8 items-center rounded-sm border border-white/20 px-3 text-xs font-semibold text-dark-text">
          Reject
        </span>
      </div>
    </div>
  );
}

const TAGS = [
  { tag: 'house', source: 'Suggested from your library', checked: true },
  { tag: 'night', source: 'From file names', checked: true },
  { tag: 'stems', source: 'From file names', checked: false },
];

/**
 * An HTML mock of the Vault's Detect drawer for the /cadenceavault showcase
 * (WEB-V2-SPEC §5.4), until a clean screenshot exists. It follows DETECT-SPEC's
 * copy deck: rule-based, local, nothing written until accepted, and no wording
 * that claims more than the rules do. Not interactive: it is a picture.
 */
export default function DetectCard() {
  return (
    <div
      role="img"
      aria-label="Detect suggests 128 BPM with high confidence and A Minor with medium confidence, detected from the audio, plus tags from your library and file names. Nothing changes until you accept it."
      className="overflow-hidden rounded-lg border border-white/10 bg-showroom-to shadow-brand-glow ring-1 ring-white/5"
    >
      <div className="flex items-start gap-3 px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-950 text-brand-300">
          <Waveform size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-dark-text">Detect key, BPM and tags</p>
          <p className="text-xs text-dark-muted">Night Ferry · Free · runs on this computer</p>
          <p className="mt-1 truncate text-xs text-dark-muted">Analyzing: Bounces/Night Ferry v3.wav</p>
        </div>
      </div>
      <Field
        label="BPM"
        value="128"
        level="High"
        source="Detected from the audio"
        alternates="Other tempos: 64 · half"
      />
      <Field
        label="Key"
        value="A Minor"
        level="Medium"
        source="Detected from the audio"
        alternates="Also likely: C Major · relative"
      />
      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-dark-muted">Tag suggestions</p>
        <ul className="mt-3 space-y-2">
          {TAGS.map((t) => (
            <li key={t.tag} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                  t.checked ? 'border-brand-400 bg-brand-400 text-brand-950' : 'border-white/30'
                }`}
              >
                {t.checked && <Check size={16} className="h-3 w-3" />}
              </span>
              <span className="font-medium text-dark-text">{t.tag}</span>
              <span className="truncate text-xs text-dark-muted">{t.source}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
        <span className="text-xs text-dark-muted">Nothing changes until you apply.</span>
        <span className="inline-flex h-9 shrink-0 items-center rounded-sm bg-accent px-4 text-xs font-semibold text-white">
          Apply 4 changes
        </span>
      </div>
    </div>
  );
}
