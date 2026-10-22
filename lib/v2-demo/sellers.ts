/**
 * The demo person and the Market's sellers (WEB-V2-SPEC §2.5, §6.3).
 *
 * Every seller except `cadencea` is fictional. The one demo person is Maya Lind,
 * on Standard, who releases as Nightjar (DECISIONS.md D1): her wallet is
 * CREDITS-MODEL §10's and her releases are RELEASE-LIFECYCLE §7.4's seeds.
 * Song-only artists aren't Market sellers: songs are on Stream only (D19).
 */
import type { CategoryKey } from './categories.ts';

export const PERSONA = {
  /** CREDITS-MODEL §10 `user.id`; also the `sellerId` of Nightjar's releases. */
  userId: 'demo-maya',
  personName: 'Maya Lind',
  artistName: 'Nightjar',
  sellerHandle: 'nightjar',
  planId: 'standard',
  planName: 'Standard',
} as const;

/** PersonaBanner, the same on every v2 page; {name} is the creator profile's display name. */
export const PERSONA_LINE_TEMPLATE = 'Demo account: Maya Lind, releasing as {name} · Standard plan';
export const PERSONA_LINE = PERSONA_LINE_TEMPLATE.replace('{name}', PERSONA.artistName);

/** Shown under the persona line when someone is signed in ({displayName}). */
export const SIGNED_IN_NOTE = "You're signed in as {displayName}. This page shows a demo account, not yours.";

export interface Seller {
  handle: string;
  displayName: string;
  /** "Bergen, Norway"; null for Cadencea Originals. */
  location: string | null;
  genres: string[];
  sells: CategoryKey[];
  bio: string;
  /** ISO date of the first listing ("Selling since {month year}"). */
  sellingSince: string;
  fictional: boolean;
  firstParty: boolean;
}

export const SELLERS: readonly Seller[] = [
  {
    handle: 'lowfen',
    displayName: 'Lowfen',
    location: 'Bergen, Norway',
    genres: ['ambient', 'downtempo'],
    sells: ['samples', 'presets', 'midi'],
    bio: 'Lowfen records drums, room tone and field recordings around Bergen and shapes them into slow, warm material for ambient and downtempo producers.',
    sellingSince: '2026-06-02',
    fictional: true,
    firstParty: false,
  },
  {
    handle: 'kiln-theory',
    displayName: 'Kiln Theory',
    location: 'Manchester, UK',
    genres: ['drill', 'trap'],
    sells: ['samples', 'presets', 'beats'],
    bio: 'Kiln Theory makes dark drums, 808s and bass presets for drill and trap, recorded and programmed in a small Manchester studio.',
    sellingSince: '2026-06-09',
    fictional: true,
    firstParty: false,
  },
  {
    handle: 'saltglass',
    displayName: 'Saltglass',
    location: 'Rotterdam, Netherlands',
    genres: ['house', 'UK garage'],
    sells: ['samples', 'presets', 'midi'],
    bio: 'Saltglass builds swung drums, chord stabs and keys for house and garage, all played and sampled in Rotterdam.',
    sellingSince: '2026-06-16',
    fictional: true,
    firstParty: false,
  },
  {
    handle: 'nordvind',
    displayName: 'Nordvind Audio',
    location: 'Trondheim, Norway',
    genres: ['cinematic', 'neo-classical'],
    sells: ['samples', 'midi'],
    bio: 'Nordvind Audio records foley, strings and piano in Trondheim for film, games and neo-classical writing.',
    sellingSince: '2026-07-01',
    fictional: true,
    firstParty: false,
  },
  {
    handle: 'plum-static',
    displayName: 'Plum Static',
    location: 'Lisbon, Portugal',
    genres: ['lo-fi', 'hip-hop'],
    sells: ['splits', 'midi', 'beats'],
    bio: 'Plum Static plays dusty piano and jazz voicings into a tape machine, then cuts them into loops, MIDI and beats.',
    sellingSince: '2026-06-23',
    fictional: true,
    firstParty: false,
  },
  {
    handle: 'velvet-ordnance',
    displayName: 'Velvet Ordnance',
    location: 'Berlin, Germany',
    genres: ['synthwave', 'retro'],
    sells: ['presets', 'beats'],
    bio: 'Velvet Ordnance designs analog-style pads, leads and basses for synthwave, and produces beats with the same sounds.',
    sellingSince: '2026-07-07',
    fictional: true,
    firstParty: false,
  },
  {
    handle: 'okra-sun',
    displayName: 'Okra Sun',
    location: 'Accra, Ghana',
    genres: ['afrobeats', 'amapiano'],
    sells: ['splits', 'midi', 'beats'],
    bio: 'Okra Sun writes guitar lines, log drum patterns and melodies for afrobeats and amapiano, and shares many of them as Splits.',
    sellingSince: '2026-07-14',
    fictional: true,
    firstParty: false,
  },
  {
    handle: 'mire-and-mica',
    displayName: 'Mire & Mica',
    location: 'Bristol, UK',
    genres: ['UK garage', 'dubstep', 'grime'],
    sells: ['splits', 'beats'],
    bio: 'Mire & Mica are a Bristol duo making garage, dubstep and grime, and they share their loops as Splits.',
    sellingSince: '2026-07-21',
    fictional: true,
    firstParty: false,
  },
  {
    handle: 'arlo-beats',
    displayName: 'Arlo Beats',
    location: 'Gothenburg, Sweden',
    genres: ['lo-fi', 'hip-hop'],
    sells: ['samples'],
    bio: 'Arlo Beats samples an old Rhodes and a cassette deck in Gothenburg and turns them into lo-fi loops and keys.',
    sellingSince: '2026-06-05',
    fictional: true,
    firstParty: false,
  },
  {
    handle: 'nadia-waves',
    displayName: 'Nadia Waves',
    location: 'Copenhagen, Denmark',
    genres: ['bass', 'electronic'],
    sells: ['presets'],
    bio: 'Nadia Waves designs bass and lead presets for electronic music, starting from analog synths she owns.',
    sellingSince: '2026-06-19',
    fictional: true,
    firstParty: false,
  },
  {
    handle: 'kofi-sound',
    displayName: 'Kofi Sound',
    location: 'Amsterdam, Netherlands',
    genres: ['ambient', 'R&B'],
    sells: ['presets'],
    bio: 'Kofi Sound makes soft pads and keys presets for ambient and R&B producers.',
    sellingSince: '2026-07-03',
    fictional: true,
    firstParty: false,
  },
  {
    handle: 'nightjar',
    displayName: 'Nightjar',
    location: 'Tromsø, Norway',
    genres: ['downtempo', 'electronic'],
    sells: ['samples', 'presets', 'beats'],
    bio: 'Nightjar is the artist name of Maya Lind, who makes downtempo and electronic music in Tromsø, plus the drums, presets and beats behind it.',
    sellingSince: '2026-06-01',
    fictional: true,
    firstParty: false,
  },
  {
    handle: 'cadencea',
    displayName: 'Cadencea Originals',
    location: null,
    genres: [],
    sells: ['samples', 'themes'],
    bio: 'Themes and packs made by the Cadencea team. Welcome credits can be spent here.',
    sellingSince: '2026-06-01',
    fictional: false,
    firstParty: true,
  },
];

export function getSeller(handle: string): Seller | null {
  return SELLERS.find((s) => s.handle === handle) ?? null;
}
