/**
 * The Market seed (WEB-V2-SPEC §6.4): 43 listings, 39 on sale at seed time.
 * No songs: they publish to Cadencea Stream only (DECISIONS.md D19).
 *
 * Every producer, release and price is fictional demo data, not a product
 * decision. Rows marked `lifecycle` are Nightjar's releases (§6.5): they carry
 * only their slug, title, type and release id, and read everything else from
 * the lifecycle store (linked.ts, resolve.ts). Slugs bought in Maya's seeded
 * library (credits/library-seed.ts) are fixed: tape-drums-vol-1, dusty-keys,
 * copper-tape-loops (file midnight-rhodes-92), velvet-pads and analog-bass.
 * tests/v2-market-data.test.mjs checks the pricing and content rules.
 */
import type { KeyValue, LeaseTierId, Price } from '../release-lifecycle/types.ts';
import { decodeKey } from '../format.ts';
import { ITEM_COPY } from './copy.ts';
import type { LinkedItem, MarketItem, MarketLeaseTier, SeedItem, VersionEntry } from './types.ts';

/** A key from its URL code ("F#m", "A#", "none"). */
const key = (code: string): KeyValue => decodeKey(code) ?? null;
const credits = (n: number): Price => ({ kind: 'credits', credits: n });
const ZERO: Price = { kind: 'free' };
const PER_TIER: Price = { kind: 'per_tier' };

const firstRelease = (date: string): VersionEntry[] => [{ version: 1, date, note: ITEM_COPY.firstRelease }];

/** Enabled lease tiers in euros, in tier order. */
function leases(prices: Partial<Record<LeaseTierId, number>>): MarketLeaseTier[] {
  return (['wav', 'stems', 'unlimited', 'exclusive'] as const)
    .filter((tier) => prices[tier] !== undefined)
    .map((tier) => ({ tier, priceEurCents: (prices[tier] as number) * 100 }));
}

const linked = (slug: string, title: string, type: LinkedItem['type'], releaseId: string): LinkedItem => ({
  source: 'lifecycle',
  slug,
  title,
  type,
  seller: 'nightjar',
  releaseId,
});

const LOOP_PATTERN = '{prefix}_{name}_{bpm}_{n}';
const KEYED_LOOP_PATTERN = '{prefix}_{name}_{bpm}_{key}_{n}';
const PRESET_PATTERN = '{prefix} {name} {n}';
const MIDI_PATTERN = '{prefix}_{name}_{key}_{n}';
const DEMO_PATTERN = '{name}';

const SAMPLE_PACKS: readonly SeedItem[] = [
  {
    source: 'seed',
    slug: 'driftwood-drums',
    title: 'Driftwood Drums Vol. 1',
    type: 'sample_pack',
    seller: 'lowfen',
    featured: true,
    bpm: 90,
    key: null,
    genre: 'downtempo',
    tags: ['drums', 'organic', 'downtempo'],
    price: credits(70),
    description:
      'Kicks, snares, brushes and shakers recorded on a driftwood-and-skin kit in a boathouse outside Bergen. Every hit is a single take with the room left in, so the kit sits warm and a little loose under downtempo and ambient tracks. Twelve slow grooves at 90 BPM show how the pieces fit together.',
    publishedAt: '2026-06-02T10:00:00Z',
    versions: [
      ...firstRelease('2026-06-02T10:00:00Z'),
      { version: 2, date: '2026-08-18T10:00:00Z', note: '6 new one-shots: two kicks, two rim shots and two shakers.' },
    ],
    files: {
      prefix: 'DD1',
      groups: [
        {
          kind: 'one_shot',
          count: 64,
          names: ['Kick_Round', 'Kick_Dry', 'Snare_Brush', 'Snare_Rim', 'Hat_Closed', 'Hat_Open', 'Shaker_Seed', 'Tom_Low'],
        },
        { kind: 'loop', count: 12, names: ['Groove_Slow', 'Groove_Brushed', 'Groove_Shuffle'], pattern: LOOP_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'tram-line-textures',
    title: 'Tram Line Textures',
    type: 'sample_pack',
    seller: 'lowfen',
    bpm: 72,
    key: key('Dm'),
    genre: 'ambient',
    tags: ['ambient', 'field recording', 'texture'],
    price: credits(30),
    description:
      "Field recordings from Bergen's light rail, turned into drones, washes and small percussive details. The tonal beds are tuned to D Minor and loop cleanly at 72 BPM. Use them as a floor under ambient pieces or as transitions between sections.",
    publishedAt: '2026-06-20T10:00:00Z',
    versions: firstRelease('2026-06-20T10:00:00Z'),
    files: {
      prefix: 'TLT',
      groups: [
        { kind: 'loop', count: 24, names: ['Tram_Hum', 'Platform_Rain', 'Rail_Drone', 'Station_Air'], pattern: KEYED_LOOP_PATTERN },
        { kind: 'one_shot', count: 14, names: ['Door_Chime', 'Brake_Hiss', 'Ticket_Click', 'Bell'] },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'kiln-drill-kit',
    title: 'Kiln Drill Kit',
    type: 'sample_pack',
    seller: 'kiln-theory',
    bpm: 142,
    key: key('F#m'),
    genre: 'drill',
    tags: ['drill', '808', 'dark'],
    price: credits(120),
    description:
      "A full drill kit: punchy kicks, sliding 808s tuned to F# Minor, hats with the rolls already programmed, and 36 loops at 142 BPM. Everything was recorded and programmed in Kiln Theory's Manchester room, then printed through the same small analog desk. Dark, dry and ready to arrange.",
    publishedAt: '2026-06-09T10:00:00Z',
    versions: firstRelease('2026-06-09T10:00:00Z'),
    files: {
      prefix: 'KDK',
      groups: [
        { kind: 'one_shot', count: 72, names: ['Kick', 'Snare', 'Hat', 'Clap', 'Perc', 'Open_Hat'] },
        { kind: 'one_shot', count: 12, names: ['808_Slide'], keys: ['F#m'] },
        { kind: 'loop', count: 36, names: ['Drill_Groove', 'Hat_Roll', 'Bell_Melody'], pattern: KEYED_LOOP_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'coal-808s',
    title: 'Coal 808s',
    type: 'sample_pack',
    seller: 'kiln-theory',
    bpm: null,
    key: 'various',
    genre: 'trap',
    tags: ['808', 'bass', 'trap'],
    price: credits(40),
    description:
      'Forty 808 one-shots, each tuned to its own root and named with it, so the right note drops straight into a pattern. Four characters, from a clean sub to smoky distortion. No loops and no tempo, just the low end.',
    publishedAt: '2026-07-02T10:00:00Z',
    versions: firstRelease('2026-07-02T10:00:00Z'),
    files: {
      prefix: 'C808',
      groups: [
        {
          kind: 'one_shot',
          count: 40,
          names: ['Coal', 'Smoke', 'Ember', 'Ash'],
          pattern: '{prefix}_{name}_{key}_{n}',
          keys: ['Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'],
        },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'garage-tools',
    title: 'Garage Tools',
    type: 'sample_pack',
    seller: 'saltglass',
    bpm: 132,
    key: key('Gm'),
    genre: 'uk garage',
    tags: ['uk garage', 'swing'],
    price: credits(90),
    description:
      'Swung kicks, skippy snares, organ stabs and bass loops for UK garage at 132 BPM. The loops are cut from live sessions in Rotterdam with the swing kept as played, not quantized. Mix the one-shots into the loops to build your own shuffle.',
    publishedAt: '2026-06-16T10:00:00Z',
    versions: firstRelease('2026-06-16T10:00:00Z'),
    files: {
      prefix: 'GT',
      groups: [
        { kind: 'one_shot', count: 60, names: ['Kick_Shuffle', 'Snare_Skip', 'Hat_Swing', 'Rim', 'Organ_Stab'] },
        { kind: 'loop', count: 36, names: ['2Step_Groove', 'Bass_Loop', 'Organ_Loop'], pattern: KEYED_LOOP_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'harbor-house-chords',
    title: 'Harbor House Chords',
    type: 'sample_pack',
    seller: 'saltglass',
    bpm: 124,
    key: key('Am'),
    genre: 'house',
    tags: ['house', 'chords', 'keys'],
    price: credits(40),
    description:
      'Forty-eight chord and keys loops in A Minor at 124 BPM, played on an electric piano and a polysynth. Deep, bright and stab versions of each progression make them easy to layer. Built for house, and they hold up slowed down too.',
    publishedAt: '2026-08-25T10:00:00Z',
    versions: firstRelease('2026-08-25T10:00:00Z'),
    files: {
      prefix: 'HHC',
      groups: [
        { kind: 'loop', count: 48, names: ['Chords_Deep', 'Chords_Bright', 'Keys_Stab', 'Pad_Wash'], pattern: KEYED_LOOP_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'copper-tape-loops',
    title: 'Copper Tape Loops',
    type: 'sample_pack',
    seller: 'arlo-beats',
    bpm: 'various',
    key: 'various',
    genre: 'lo-fi',
    tags: ['lo-fi', 'tape', 'rhodes'],
    price: credits(50),
    description:
      'Fifty-five short Rhodes and piano loops, bounced to a cassette deck and back, between 76 and 92 BPM. Each file is named with its tempo and the key changes from loop to loop, so single loops are easy to pick out and buy on their own.',
    publishedAt: '2026-09-15T10:00:00Z',
    versions: firstRelease('2026-09-15T10:00:00Z'),
    files: {
      prefix: 'CTL',
      groups: [
        {
          kind: 'loop',
          count: 55,
          // 11 names × 5 tempos: every name-and-tempo pair appears once.
          names: [
            'Midnight Rhodes',
            'Copper Haze',
            'Tape Warble',
            'Late Bus',
            'Dust Halo',
            'Slow Kettle',
            'Window Rain',
            'Corner Shop',
            'Felt Piano',
            'Lamp Light',
            'Cassette Sun',
          ],
          pattern: '{name} {bpm} BPM',
          bpms: [92, 84, 88, 76, 80],
          keys: ['A#m', 'Fm', 'D#', 'Cm', 'G#'],
        },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'glacier-foley',
    title: 'Glacier Foley',
    type: 'sample_pack',
    seller: 'nordvind',
    bpm: null,
    key: null,
    genre: 'cinematic',
    tags: ['foley', 'cinematic', 'sound design'],
    price: credits(120),
    description:
      'Ice cracks, footsteps in snow, wind, dripping water and creaking rope, recorded on Norwegian glaciers and harbors. One hundred and fifty one-shots with no tempo or key, edited tight and named by what you hear. For film, games and cinematic sound design.',
    publishedAt: '2026-07-01T10:00:00Z',
    versions: firstRelease('2026-07-01T10:00:00Z'),
    files: {
      prefix: 'GF',
      groups: [
        { kind: 'one_shot', count: 150, names: ['Ice_Crack', 'Snow_Step', 'Wind_Gust', 'Water_Drip', 'Rope_Creak', 'Metal_Groan'] },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'dusty-keys',
    title: 'Dusty Keys: Lo-fi Sample Pack',
    type: 'sample_pack',
    seller: 'arlo-beats',
    bpm: 92,
    key: key('A#m'),
    genre: 'lo-fi',
    tags: ['lo-fi', 'keys', 'rhodes'],
    price: credits(120),
    description:
      'Rhodes loops, chopped piano phrases and vinyl textures in A# Minor at 92 BPM. Recorded on an old Rhodes through a cassette deck in Gothenburg, then trimmed to clean loop points. One hundred and forty files for lo-fi and boom bap.',
    publishedAt: '2026-06-05T10:00:00Z',
    versions: firstRelease('2026-06-05T10:00:00Z'),
    files: {
      prefix: 'DK',
      groups: [
        { kind: 'loop', count: 100, names: ['Rhodes_Loop', 'Keys_Chop', 'Chord_Loop', 'Piano_Phrase'], pattern: KEYED_LOOP_PATTERN },
        { kind: 'one_shot', count: 40, names: ['Rhodes_Hit', 'Piano_Note', 'Vinyl_Crackle', 'Tape_Stop'] },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'tape-drums-vol-1',
    title: 'Tape Drums Vol. 1',
    type: 'sample_pack',
    seller: 'cadencea',
    bpm: 96,
    key: null,
    genre: 'hip-hop',
    tags: ['drums', 'tape'],
    price: credits(20),
    description:
      'Drum one-shots and breaks run through a reel-to-reel by the Cadencea team. Thirty-two files at 96 BPM, warm and slightly squashed by the tape. Welcome credits can be spent on it.',
    publishedAt: '2026-06-01T10:00:00Z',
    versions: firstRelease('2026-06-01T10:00:00Z'),
    files: {
      prefix: 'CTD',
      groups: [
        { kind: 'one_shot', count: 24, names: ['Kick_Tape', 'Snare_Tape', 'Hat_Tape', 'Perc_Tape'] },
        { kind: 'loop', count: 8, names: ['Break'], pattern: LOOP_PATTERN },
      ],
    },
    cover: { palette: 'violet' },
  },
];

const SPLITS_PACKS: readonly SeedItem[] = [
  {
    source: 'seed',
    slug: 'amber-hour',
    title: 'Amber Hour',
    type: 'splits_pack',
    seller: 'okra-sun',
    featured: true,
    bpm: 108,
    key: key('C#m'),
    genre: 'afrobeats',
    tags: ['afrobeats', 'guitar', 'melodic'],
    price: credits(10),
    splits: { publishing: 50, advance: 50 },
    description:
      'Twelve guitar and highlife loops in C# Minor at 108 BPM, played by Okra Sun in Accra. If your song uses one, Okra Sun gets the share and credit shown in the split terms. The loops come dry, so you can process them your way.',
    publishedAt: '2026-07-14T10:00:00Z',
    versions: firstRelease('2026-07-14T10:00:00Z'),
    files: {
      prefix: 'AH',
      groups: [
        { kind: 'loop', count: 12, names: ['Guitar_Lead', 'Guitar_Rhythm', 'Highlife_Riff', 'Bass_Line'], pattern: KEYED_LOOP_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'lagoon-keys',
    title: 'Lagoon Keys',
    type: 'splits_pack',
    seller: 'okra-sun',
    bpm: 112,
    key: key('F'),
    genre: 'amapiano',
    tags: ['amapiano', 'log drum', 'keys'],
    price: ZERO,
    splits: { publishing: 25, advance: 0 },
    description:
      'Six amapiano loops at 112 BPM in F Major: log drum, shuffled keys and piano stabs. Light terms: a quarter of your producer publishing share and no share of advances.',
    publishedAt: '2026-08-30T10:00:00Z',
    versions: firstRelease('2026-08-30T10:00:00Z'),
    files: {
      prefix: 'LK',
      groups: [{ kind: 'loop', count: 6, names: ['Log_Drum', 'Keys_Shuffle', 'Piano_Stab'], pattern: KEYED_LOOP_PATTERN }],
    },
  },
  {
    source: 'seed',
    slug: 'two-step-veil',
    title: 'Two-Step Veil',
    type: 'splits_pack',
    seller: 'mire-and-mica',
    bpm: 134,
    key: key('D#m'),
    genre: 'uk garage',
    tags: ['uk garage', 'vocal chop'],
    price: ZERO,
    splits: { publishing: 50, advance: 25 },
    description:
      'Eight UK garage loops at 134 BPM in D# Minor, built around vocal phrases sung and chopped by Mire & Mica. Pads, skippy bass and shuffled keys complete the set.',
    publishedAt: '2026-07-21T10:00:00Z',
    versions: firstRelease('2026-07-21T10:00:00Z'),
    files: {
      prefix: 'TSV',
      groups: [
        { kind: 'loop', count: 8, names: ['Vocal_Chop', 'Veil_Pad', 'Skip_Bass', 'Shuffle_Keys'], pattern: KEYED_LOOP_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'bristol-rain',
    title: 'Bristol Rain',
    type: 'splits_pack',
    seller: 'mire-and-mica',
    bpm: 140,
    key: key('G#m'),
    genre: 'dubstep',
    tags: ['dubstep', 'pads', 'dark'],
    price: credits(20),
    splits: { publishing: 25, advance: 25 },
    description:
      'Twenty-four dubstep loops in G# Minor at 140 BPM: rain-soaked pads, wobbles, subs and reese basses. Recorded and resampled in Bristol.',
    publishedAt: '2026-09-08T10:00:00Z',
    versions: firstRelease('2026-09-08T10:00:00Z'),
    files: {
      prefix: 'BR',
      groups: [{ kind: 'loop', count: 24, names: ['Rain_Pad', 'Wobble', 'Sub_Line', 'Reese'], pattern: KEYED_LOOP_PATTERN }],
    },
  },
  {
    source: 'seed',
    slug: 'paper-lanterns',
    title: 'Paper Lanterns',
    type: 'splits_pack',
    seller: 'plum-static',
    bpm: 88,
    key: key('A#'),
    genre: 'lo-fi',
    tags: ['lo-fi', 'piano', 'warm'],
    price: ZERO,
    splits: { publishing: 25, advance: 0 },
    description:
      'Five warm piano and keys loops in A# Major at 88 BPM, played on a felt piano in Lisbon. A small pack with light terms for lo-fi sketches.',
    publishedAt: '2026-06-23T10:00:00Z',
    versions: firstRelease('2026-06-23T10:00:00Z'),
    files: {
      prefix: 'PL',
      groups: [
        {
          kind: 'loop',
          count: 5,
          names: ['Lantern_Piano', 'Warm_Keys', 'Felt_Melody', 'Soft_Chords', 'Night_Hum'],
          pattern: KEYED_LOOP_PATTERN,
        },
      ],
    },
  },
];

const PRESET_PACKS: readonly SeedItem[] = [
  {
    source: 'seed',
    slug: 'neon-cathedral',
    title: 'Neon Cathedral',
    type: 'preset_pack',
    seller: 'velvet-ordnance',
    featured: true,
    bpm: 100,
    key: key('Cm'),
    genre: 'synthwave',
    tags: ['synthwave', 'pads', 'leads'],
    price: credits(120),
    synth: 'serum2',
    minSynthVersion: '2.0',
    description:
      'Sixty-four Serum 2 presets: wide pads, bright leads, chrome basses and glassy plucks for synthwave. Every preset maps the mod wheel to something useful. The audio demo plays them at 100 BPM in C Minor.',
    publishedAt: '2026-07-07T10:00:00Z',
    versions: [
      ...firstRelease('2026-07-07T10:00:00Z'),
      { version: 2, date: '2026-09-02T10:00:00Z', note: '8 new leads, and the mod wheel now works on four pads that ignored it.' },
    ],
    files: {
      prefix: 'NC',
      groups: [
        {
          kind: 'preset',
          count: 64,
          names: ['Pad Cathedral', 'Lead Neon', 'Bass Chrome', 'Pluck Glass', 'Arp Night', 'Keys Halo', 'Brass Dusk', 'FX Rise'],
          pattern: PRESET_PATTERN,
        },
        { kind: 'demo', count: 1, names: ['Neon Cathedral demo'], pattern: DEMO_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'analog-dusk',
    title: 'Analog Dusk',
    type: 'preset_pack',
    seller: 'velvet-ordnance',
    bpm: 96,
    key: key('Am'),
    genre: 'synthwave',
    tags: ['retro', 'bass', 'plucks'],
    price: credits(60),
    synth: 'vital',
    minSynthVersion: '1.5',
    description:
      'Forty Vital presets modeled by ear on the basses and plucks of 80s analog synths. Each one has macros for drive, cutoff and width.',
    publishedAt: '2026-08-12T10:00:00Z',
    versions: firstRelease('2026-08-12T10:00:00Z'),
    files: {
      prefix: 'AD',
      groups: [
        { kind: 'preset', count: 40, names: ['Bass Dusk', 'Pluck Amber', 'Lead Retro', 'Pad Haze', 'Keys Tape'], pattern: PRESET_PATTERN },
        { kind: 'demo', count: 1, names: ['Analog Dusk demo'], pattern: DEMO_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'sub-pressure',
    title: 'Sub Pressure',
    type: 'preset_pack',
    seller: 'kiln-theory',
    bpm: 142,
    key: key('F#m'),
    genre: 'drill',
    tags: ['bass', '808', 'drill'],
    price: credits(50),
    synth: 'serum2',
    minSynthVersion: '2.0',
    description:
      "Thirty Serum 2 presets for drill and trap: gliding 808s, reese basses, subs and a few sirens. Tuned to sit with Kiln Theory's drum kits.",
    publishedAt: '2026-07-29T10:00:00Z',
    versions: firstRelease('2026-07-29T10:00:00Z'),
    files: {
      prefix: 'SP',
      groups: [
        { kind: 'preset', count: 30, names: ['808 Pressure', 'Bass Reese', 'Bass Sub', 'Lead Drill', 'FX Siren'], pattern: PRESET_PATTERN },
        { kind: 'demo', count: 1, names: ['Sub Pressure demo'], pattern: DEMO_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'glasshouse-keys',
    title: 'Glasshouse Keys',
    type: 'preset_pack',
    seller: 'saltglass',
    bpm: 124,
    key: key('Dm'),
    genre: 'house',
    tags: ['house', 'keys', 'stabs'],
    price: credits(80),
    synth: 'vital',
    minSynthVersion: '1.5',
    description:
      'Fifty Vital presets for house: electric pianos, organ stabs, soft pads and plucks. The audio demo plays them at 124 BPM in D Minor.',
    publishedAt: '2026-09-21T10:00:00Z',
    versions: firstRelease('2026-09-21T10:00:00Z'),
    files: {
      prefix: 'GK',
      groups: [
        { kind: 'preset', count: 50, names: ['Keys Glass', 'Stab House', 'Organ Deep', 'Pad Green', 'Pluck Dew'], pattern: PRESET_PATTERN },
        { kind: 'demo', count: 1, names: ['Glasshouse Keys demo'], pattern: DEMO_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'fjordlight-pads',
    title: 'Fjordlight Pads',
    type: 'preset_pack',
    seller: 'lowfen',
    bpm: 70,
    key: key('E'),
    genre: 'ambient',
    tags: ['ambient', 'pads'],
    price: credits(40),
    synth: 'vital',
    minSynthVersion: '1.5',
    description:
      'Thirty-six slow, evolving pads and textures for Vital, made for ambient music and film. Each pad is built to sit under a mix without crowding it.',
    publishedAt: '2026-06-30T10:00:00Z',
    versions: firstRelease('2026-06-30T10:00:00Z'),
    files: {
      prefix: 'FP',
      groups: [
        { kind: 'preset', count: 36, names: ['Pad Fjord', 'Pad Aurora', 'Pad Mist', 'Texture Ice'], pattern: PRESET_PATTERN },
        { kind: 'demo', count: 1, names: ['Fjordlight Pads demo'], pattern: DEMO_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'analog-bass',
    title: 'Analog Bass (Serum 2)',
    type: 'preset_pack',
    seller: 'nadia-waves',
    bpm: 128,
    key: key('Gm'),
    genre: 'electronic',
    tags: ['bass', 'analog'],
    price: credits(60),
    synth: 'serum2',
    minSynthVersion: '2.0',
    description:
      'Thirty-two bass presets for Serum 2, from round subs to driven squares. Nadia Waves rebuilt them by hand from recordings of analog synths she owns.',
    publishedAt: '2026-06-19T10:00:00Z',
    versions: firstRelease('2026-06-19T10:00:00Z'),
    files: {
      prefix: 'AB',
      groups: [
        { kind: 'preset', count: 32, names: ['Bass Analog', 'Bass Rubber', 'Bass Square', 'Bass Drive'], pattern: PRESET_PATTERN },
        { kind: 'demo', count: 1, names: ['Analog Bass demo'], pattern: DEMO_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'velvet-pads',
    title: 'Velvet Pads (Vital)',
    type: 'preset_pack',
    seller: 'kofi-sound',
    bpm: 80,
    key: key('F'),
    genre: 'r&b',
    tags: ['pads', 'warm'],
    price: credits(30),
    synth: 'vital',
    minSynthVersion: '1.5',
    description:
      'Twenty soft pads for Vital, tuned for R&B and ambient. Warm, slow and wide, with macros for movement and brightness.',
    publishedAt: '2026-07-03T10:00:00Z',
    versions: firstRelease('2026-07-03T10:00:00Z'),
    files: {
      prefix: 'VP',
      groups: [
        { kind: 'preset', count: 20, names: ['Pad Velvet', 'Pad Silk', 'Pad Warm', 'Pad Cloud'], pattern: PRESET_PATTERN },
        { kind: 'demo', count: 1, names: ['Velvet Pads demo'], pattern: DEMO_PATTERN },
      ],
    },
  },
];

const MIDI_PACKS: readonly SeedItem[] = [
  {
    source: 'seed',
    slug: 'cinematic-progressions',
    title: 'Cinematic Progressions',
    type: 'midi_pack',
    seller: 'nordvind',
    bpm: 70,
    key: key('Dm'),
    genre: 'cinematic',
    tags: ['cinematic', 'chords', 'strings'],
    price: credits(50),
    description:
      'Sixty MIDI files of string, choir and piano progressions in D Minor, plus ostinatos to drive a cue. Play them on any instrument and change the voicings to make them yours. The audio demo shows them orchestrated.',
    publishedAt: '2026-07-01T10:00:00Z',
    versions: firstRelease('2026-07-01T10:00:00Z'),
    files: {
      prefix: 'CP',
      groups: [
        { kind: 'midi', count: 60, names: ['Prog_Strings', 'Prog_Choir', 'Prog_Piano', 'Ostinato'], pattern: MIDI_PATTERN },
        { kind: 'demo', count: 1, names: ['Cinematic Progressions demo'], pattern: DEMO_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'garage-chord-memos',
    title: 'Garage Chord Memos',
    type: 'midi_pack',
    seller: 'saltglass',
    bpm: 130,
    key: key('Fm'),
    genre: 'uk garage',
    tags: ['uk garage', 'chords'],
    price: credits(30),
    description:
      'Forty chord progressions in F Minor at 130 BPM, written for UK garage organs, stabs and pads. Short memos, ready to rearrange.',
    publishedAt: '2026-08-05T10:00:00Z',
    versions: firstRelease('2026-08-05T10:00:00Z'),
    files: {
      prefix: 'GCM',
      groups: [
        { kind: 'midi', count: 40, names: ['Chords_Organ', 'Chords_Stab', 'Chords_Rhodes', 'Chords_Pad'], pattern: MIDI_PATTERN },
        { kind: 'demo', count: 1, names: ['Garage Chord Memos demo'], pattern: DEMO_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'melody-sketchbook',
    title: 'Melody Sketchbook',
    type: 'midi_pack',
    seller: 'okra-sun',
    bpm: 110,
    key: key('G'),
    genre: 'afrobeats',
    tags: ['afrobeats', 'melody'],
    price: credits(40),
    description:
      'Fifty melodies, hooks and counter-lines in G Major at 110 BPM, written for afrobeats guitar, flute and keys. Each idea comes in a short and a long version, so you can loop it or build a whole section from it.',
    publishedAt: '2026-09-26T10:00:00Z',
    versions: firstRelease('2026-09-26T10:00:00Z'),
    files: {
      prefix: 'MS',
      groups: [
        { kind: 'midi', count: 50, names: ['Melody_Guitar', 'Melody_Flute', 'Melody_Keys', 'Hook', 'Counter'], pattern: MIDI_PATTERN },
        { kind: 'demo', count: 1, names: ['Melody Sketchbook demo'], pattern: DEMO_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'lofi-voicings',
    title: 'Lo-fi Voicings',
    type: 'midi_pack',
    seller: 'plum-static',
    bpm: 85,
    key: key('A#m'),
    genre: 'lo-fi',
    tags: ['lo-fi', 'jazz', 'chords'],
    price: credits(30),
    description:
      'Forty-five jazz voicings, walking bass lines and turnarounds in A# Minor at 85 BPM. Put them on a Rhodes or piano patch and move the voices around.',
    publishedAt: '2026-07-16T10:00:00Z',
    versions: firstRelease('2026-07-16T10:00:00Z'),
    files: {
      prefix: 'LV',
      groups: [
        {
          kind: 'midi',
          count: 45,
          names: ['Voicing_Jazz', 'Voicing_Rhodes', 'Walk_Bass', 'Voicing_Piano', 'Turnaround'],
          pattern: MIDI_PATTERN,
        },
        { kind: 'demo', count: 1, names: ['Lo-fi Voicings demo'], pattern: DEMO_PATTERN },
      ],
    },
  },
  {
    source: 'seed',
    slug: 'ambient-motifs',
    title: 'Ambient Motifs',
    type: 'midi_pack',
    seller: 'lowfen',
    bpm: 70,
    key: key('Em'),
    genre: 'ambient',
    tags: ['ambient', 'motifs', 'piano'],
    price: credits(30),
    description:
      'Thirty-six short piano, celesta, string and bell motifs in E Minor at 70 BPM, for ambient pieces and film cues. They leave plenty of space, so they layer well over pads and field recordings.',
    publishedAt: '2026-10-02T10:00:00Z',
    versions: firstRelease('2026-10-02T10:00:00Z'),
    files: {
      prefix: 'AM',
      groups: [
        { kind: 'midi', count: 36, names: ['Motif_Piano', 'Motif_Celesta', 'Motif_Strings', 'Motif_Bells'], pattern: MIDI_PATTERN },
        { kind: 'demo', count: 1, names: ['Ambient Motifs demo'], pattern: DEMO_PATTERN },
      ],
    },
  },
];

const BEATS: readonly SeedItem[] = [
  {
    source: 'seed',
    slug: 'slow-orbit',
    title: 'Slow Orbit',
    type: 'beat',
    seller: 'plum-static',
    bpm: 86,
    key: key('Am'),
    genre: 'lo-fi',
    tags: ['lo-fi hip-hop', 'boom bap'],
    price: PER_TIER,
    leaseTiers: leases({ wav: 25, stems: 60, unlimited: 120 }),
    description:
      'A boom bap beat at 86 BPM in A Minor, built on a dusty piano loop and live-played drums. Leased with WAV or stems; there is no exclusive.',
    publishedAt: '2026-06-27T10:00:00Z',
    versions: firstRelease('2026-06-27T10:00:00Z'),
  },
  {
    source: 'seed',
    slug: 'cold-concrete',
    title: 'Cold Concrete',
    type: 'beat',
    seller: 'kiln-theory',
    featured: true,
    bpm: 144,
    key: key('C#m'),
    genre: 'drill',
    tags: ['drill', 'dark'],
    price: PER_TIER,
    leaseTiers: leases({ wav: 30, stems: 75, unlimited: 150, exclusive: 650 }),
    description:
      'A dark drill beat at 144 BPM in C# Minor with sliding 808s and a sparse bell melody. All four licenses are available, exclusive included.',
    publishedAt: '2026-08-19T10:00:00Z',
    versions: firstRelease('2026-08-19T10:00:00Z'),
  },
  {
    source: 'seed',
    slug: 'sunday-fever',
    title: 'Sunday Fever',
    type: 'beat',
    seller: 'okra-sun',
    bpm: 104,
    key: key('F#m'),
    genre: 'afrobeats',
    tags: ['afrobeats', 'bounce'],
    price: PER_TIER,
    leaseTiers: leases({ wav: 30, stems: 75, unlimited: 150, exclusive: 500 }),
    description:
      'An afrobeats beat at 104 BPM in F# Minor with live guitar, log drum and a bouncing groove. Okra Sun played the guitar parts in one take and kept the room sound.',
    publishedAt: '2026-08-08T10:00:00Z',
    versions: firstRelease('2026-08-08T10:00:00Z'),
  },
  {
    source: 'seed',
    slug: 'velour-tape',
    title: 'Velour Tape',
    type: 'beat',
    seller: 'plum-static',
    bpm: 92,
    key: key('Bm'),
    genre: 'r&b',
    tags: ['r&b', 'smooth'],
    price: PER_TIER,
    leaseTiers: leases({ wav: 35, stems: 80, unlimited: 160 }),
    description:
      'A smooth R&B beat at 92 BPM in B Minor with Rhodes chords and soft, swung drums. It leaves room in the middle for a lead vocal.',
    publishedAt: '2026-09-10T10:00:00Z',
    versions: firstRelease('2026-09-10T10:00:00Z'),
  },
  {
    source: 'seed',
    slug: 'night-shift',
    title: 'Night Shift',
    type: 'beat',
    seller: 'mire-and-mica',
    bpm: 140,
    key: key('Em'),
    genre: 'grime',
    tags: ['grime', 'dark'],
    price: PER_TIER,
    leaseTiers: leases({ wav: 30, unlimited: 150 }),
    description:
      'A grime beat at 140 BPM in E Minor with square-wave leads and a heavy sub. Offered as a WAV lease or an unlimited lease.',
    publishedAt: '2026-09-29T10:00:00Z',
    versions: firstRelease('2026-09-29T10:00:00Z'),
  },
  {
    source: 'seed',
    slug: 'glass-arcade',
    title: 'Glass Arcade',
    type: 'beat',
    seller: 'velvet-ordnance',
    bpm: 120,
    key: key('Gm'),
    genre: 'synth-pop',
    tags: ['synth-pop', 'retro'],
    price: PER_TIER,
    leaseTiers: leases({ wav: 30, stems: 75, unlimited: 150, exclusive: 500 }),
    description:
      'A synth-pop beat at 120 BPM in G Minor, built from the same synths as Neon Cathedral. Gated drums, an arpeggiated bass and a wide chorus pad.',
    publishedAt: '2026-07-24T10:00:00Z',
    versions: firstRelease('2026-07-24T10:00:00Z'),
  },
];

const THEMES: readonly SeedItem[] = [
  {
    source: 'seed',
    slug: 'theme-celestia',
    title: 'Celestia',
    type: 'theme',
    seller: 'cadencea',
    bpm: null,
    key: undefined,
    genre: null,
    tags: ['dark', 'violet', 'starfield'],
    price: credits(80),
    description:
      'A premium dark theme for Cadencea Vault: deep violet surfaces and a quiet starfield behind your library. Made by the Cadencea team.',
    publishedAt: '2026-10-01T10:00:00Z',
    versions: firstRelease('2026-10-01T10:00:00Z'),
    cover: { palette: 'violet' },
  },
  {
    source: 'seed',
    slug: 'theme-aurora-mono',
    title: 'Aurora Mono',
    type: 'theme',
    seller: 'cadencea',
    bpm: null,
    key: undefined,
    genre: null,
    tags: ['minimal', 'monochrome'],
    price: credits(30),
    description:
      'A minimal monochrome theme for Cadencea Vault, with high contrast for long sessions. Made by the Cadencea team.',
    publishedAt: '2026-06-01T10:00:00Z',
    versions: firstRelease('2026-06-01T10:00:00Z'),
    cover: { palette: 'slate' },
  },
  {
    source: 'seed',
    slug: 'theme-tape-room',
    title: 'Tape Room',
    type: 'theme',
    seller: 'cadencea',
    bpm: null,
    key: undefined,
    genre: null,
    tags: ['warm', 'retro'],
    price: credits(30),
    description:
      'A warm retro theme for Cadencea Vault in tape-machine browns and amber. Made by the Cadencea team.',
    publishedAt: '2026-08-20T10:00:00Z',
    versions: firstRelease('2026-08-20T10:00:00Z'),
    cover: { palette: 'ember' },
  },
];

/** Nightjar's releases (WEB-V2-SPEC §6.5), in the §6.4 table's order. */
const LINKED_ROWS: readonly LinkedItem[] = [
  linked('tidewater-drums', 'Tidewater Drums', 'sample_pack', 'demo-r02'),
  linked('kitchen-percussion', 'Kitchen Percussion', 'sample_pack', 'demo-r13'),
  linked('copper-kit', 'Copper Kit', 'sample_pack', 'demo-r10'),
  linked('old-synth-memories', 'Old Synth Memories', 'preset_pack', 'demo-r09'),
  linked('ice-road', 'Ice Road', 'beat', 'demo-r07'),
  linked('glass-steps', 'Glass Steps', 'beat', 'demo-r11'),
  linked('night-bus', 'Night Bus', 'beat', 'demo-r15'),
];

export const MARKET_ITEMS: readonly MarketItem[] = [
  ...SAMPLE_PACKS,
  ...SPLITS_PACKS,
  ...PRESET_PACKS,
  ...MIDI_PACKS,
  ...BEATS,
  ...THEMES,
  ...LINKED_ROWS,
];

export function getItem(slug: string): MarketItem | null {
  return MARKET_ITEMS.find((item) => item.slug === slug) ?? null;
}
