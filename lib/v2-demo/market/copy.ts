/**
 * Market strings (WEB-V2-SPEC §4.2–§4.5). Strings that CREDITS-MODEL §9 or
 * RELEASE-LIFECYCLE §9 own are imported from their copy files, not retyped.
 * Fill "{name}" placeholders with `fill()` from ../format.ts. Toasts start with
 * "Demo:"; DemoConfirm adds " (demo)" to confirm labels itself.
 */

/** §4.2 */
export const MARKET_HOME_COPY = {
  eyebrow: 'Cadencea Market · Preview',
  title: 'Sounds made by people, published from their vault.',
  lead: 'Sample packs, Splits, presets, MIDI and beats from independent producers, themes from Cadencea, and songs from Cadencea Stream. A person reviews every release before it goes live.',
  searchLabel: 'Search the Market',
  searchPlaceholder: 'Search sounds, producers or tags',
  searchSubmit: 'Search',
  trustPoints: ['Reviewed by a person', 'Credits and euros side by side', 'Sellers are paid in euros'],
  sell: 'Sell on Cadencea',
  categoryNavLabel: 'Market categories',
  allLabel: 'All',
  featuredTitle: 'Featured by Cadencea',
  seeAll: 'See all {n}',
  splitsTitle: 'Splits: loops with the deal built in.',
  splitsBody:
    'A Splits pack is a set of loops with royalty terms attached. If you release a song that uses one, the loop maker gets the share and credit shown on the pack, and Cadencea generates the split sheet.',
  splitsPoints: [
    'Terms shown in full before you download',
    'One standard contract, with the shares on each pack',
    'You both register with your own PRO',
  ],
  splitsButton: 'Browse Splits',
  howTitle: 'How the Market works',
  howSteps: [
    'Producers publish from Cadencea Vault. BPM, key, tags and files come straight from their projects.',
    'A person reviews every release against the Human-Made Standard.',
    'Credits buy tools for making music, and money buys music. Sounds, presets, MIDI and themes cost credits; beats are paid by card. Sellers are paid in euros.',
  ],
  comingLater: 'Coming later: DAW project templates.',
  footnote: 'Demo catalog. Every producer, release and price here is fictional.',
  allResultsTitle: 'All results',
  allResultsLead: 'Every listing in the Market that matches your search.',
} as const;

/** §4.2 category nav: short labels in nav order (the page headings use the long labels in categories.ts). */
export const CATEGORY_NAV_LABEL = {
  samples: 'Samples',
  splits: 'Splits',
  presets: 'Presets',
  midi: 'MIDI',
  beats: 'Beats',
  songs: 'Songs',
  themes: 'Themes',
} as const;

/** §4.2 MarketCard and the grids. */
export const CARD_COPY = {
  demoRelease: 'Your demo release',
  royaltySplit: 'Royalty-split',
  resultsHeading: 'Results',
  results: '{n} results',
  oneResult: '1 result',
  emptyTitle: 'Nothing matches these filters.',
  emptyBody: 'Try a wider BPM range or fewer tags.',
  emptyAction: 'Clear filters',
} as const;

/** §4.3 toolbar and filter panel. */
export const FILTER_COPY = {
  searchLabel: 'Search this category',
  searchAllLabel: 'Search the Market',
  sortLabel: 'Sort by',
  sortOptions: [
    { value: 'new', label: 'Newest' },
    { value: 'price-asc', label: 'Price: low to high' },
    { value: 'price-desc', label: 'Price: high to low' },
    { value: 'bpm-asc', label: 'BPM: low to high' },
    { value: 'title', label: 'Title A–Z' },
  ],
  filtersButton: 'Filters',
  panelTitle: 'Filters',
  showResults: 'Show {n} results',
  showOneResult: 'Show 1 result',
  bpmTitle: 'BPM',
  bpmMin: 'Min BPM',
  bpmMax: 'Max BPM',
  bpmPresets: [
    { label: 'Under 90', min: null, max: 89 },
    { label: '90–120', min: 90, max: 120 },
    { label: '120–140', min: 120, max: 140 },
    { label: '140+', min: 140, max: null },
  ],
  halfTime: 'Include half and double time',
  keyTitle: 'Key',
  minor: 'Minor',
  major: 'Major',
  noKey: 'No key',
  anyKey: 'Any key',
  genreTitle: 'Genre',
  tagsTitle: 'Tags',
  priceTitle: 'Price',
  creditPriceOptions: [
    { label: '0 credits', max: 0 },
    { label: 'Up to 50 credits (€5)', max: 50 },
    { label: 'Up to 150 credits (€15)', max: 150 },
  ],
  beatPriceOptions: [{ label: 'WAV lease under €40', maxEur: 40 }],
  anyPrice: 'Any',
  synthTitle: 'Synth',
  licenseTitle: 'License',
  licenseOptions: [
    { value: 'stems', label: 'Has stems' },
    { value: 'exclusive', label: 'Exclusive available' },
  ],
  activeLabel: 'Active filters',
  remove: 'Remove filter: {label}',
  clearAll: 'Clear all',
  search: 'Search: {q}',
  halfChip: 'Half and double time',
  bpmRange: '{min}–{max} BPM',
  bpmFrom: '{min}+ BPM',
  bpmTo: 'Up to {max} BPM',
  maxChip: 'Up to {credits} ({eur})',
  maxEurChip: 'WAV lease under €{eur}',
} as const;

/** §4.4 item page, buy box and its dialogs. */
export const ITEM_COPY = {
  breadcrumbLabel: 'Breadcrumb',
  market: 'Market',
  contents: 'Contents',
  showAllFiles: 'Show all {n} files',
  buyFile: 'Buy this file · {price}',
  buyFileShort: 'Buy',
  fileOwned: 'In your library',
  buyFileTitle: 'Buy {title}?',
  metaTitle: 'Details',
  metaBpm: 'BPM',
  metaKey: 'Key',
  metaFiles: 'Files',
  metaSize: 'Size and format',
  metaSynth: 'Synth',
  metaFormat: 'Format',
  tagsLabel: 'Tags',
  buyBoxLabel: 'Buy',
  listenBoxLabel: 'Listen and support',
  buyTitle: 'Buy {title}?',
  buyBody: "Demo: {credits} demo credits leave Maya's demo wallet ({i} included + {b} bought). No money moves.",
  buyBodyOne: "Demo: 1 demo credit leaves Maya's demo wallet ({i} included + {b} bought). No money moves.",
  buyConfirm: 'Buy',
  boughtToast: 'Demo: {title} is in the demo library.',
  welcomeApply: 'Welcome credits apply',
  topUp: 'Top up to buy this',
  topUpSuggestion: 'Checkout suggests the smallest top-up that covers it: €{amount}.',
  topUpSteps: 'Top up in more than one step.',
  ownListing:
    "Demo only: the real Market doesn't let you buy your own release. The demo allows it so you can see what buyers get.",
  getPack: 'Get this pack',
  getTitle: 'Get {title}?',
  getBody: "Demo: the pack goes into Maya's demo library with the split terms above. No credits move.",
  getConfirm: 'Get',
  returnButton: 'Return it (demo)',
  returnNote: "A purchase you haven't downloaded can be returned within 14 days.",
  returnTitle: 'Return {title}?',
  returnBody:
    "Demo: {credits} demo credits go back to Maya's demo wallet, to the lots they came from ({i} included + {b} bought). No money moves.",
  returnConfirm: 'Return',
  returnedToast: 'Demo: {title} was returned. The credits are back in the demo wallet.',
  downloadTitle: 'Download version {k} of {title}?',
  downloadBodyFirst:
    'Demo: no file is downloaded. In the real Market, starting the download ends your 14-day right to cancel.',
  downloadBodyAgain: 'Demo: no file is downloaded.',
  downloadConfirm: 'Download',
  downloadedToast: 'Demo: version {k} of {title} is marked as downloaded.',
  splitTermsTitle: 'Split terms',
  splitTermsBody:
    'If you release music using these loops, you give {seller} {publishing}% of your producer publishing share, {advance}% of advances and fees, and the credit "{creditLine}". Cadencea generates the paperwork; you both register splits with your own PRO.',
  beatsLegend: 'Choose a license',
  beatsNote: "Paid by card, one all-in price. Credits can't buy beats.",
  buyTier: 'Buy {tier} · {price}',
  buyTierTitle: 'Buy the {tier} for {title}?',
  cardBody: "Card checkout isn't connected in this preview. No payment is taken.",
  ownedTier: 'Your license: {tier}',
  listen: 'Listen on Cadencea Stream',
  support: 'Support {artist}',
  supportTitle: 'Support {artist}?',
  supportBody: "Fan support is paid by card, from {min}. Card checkout isn't connected in this preview.",
  supportConfirm: 'Support',
  supportToast: 'Demo: no support was sent and no payment was taken.',
  themeVault: 'For Cadencea Vault 2.0 and later',
  themeNote: 'Themes that are free in Cadencea Vault today stay free.',
  previewFootnote:
    "Demo audio is generated in your browser. Real listings play the seller's own preview, delivered as uploaded.",
  humanMadeBody:
    'A person at Cadencea reviewed this release against the Human-Made Standard before it went live.',
  humanMadeLink: 'Read the Human-Made Standard',
  close: 'Close',
  firstRelease: 'First release.',
  versionsSummary: 'Version history',
  versionsCaption: 'Updates are reviewed before they go live. You keep the version you bought.',
  versionLine: 'Version {n} · {date}',
  report: 'Report this listing',
  reportTitle: 'Report {title}?',
  reportBody: 'Demo: nothing is sent. Pick the reason a real report would give.',
  reportLegend: 'Reason',
  reportConfirm: 'Send report',
  reportReasons: ['Copyright', 'Generated audio', 'Scam', 'Low quality', 'Broken files', 'Other'],
  reportToast: 'Demo: report not sent.',
  moreFrom: 'More from {seller}',
  similar: 'Similar sounds',
  offSaleBack: 'Browse {category}',
  offSaleOwned: 'You bought it, so your downloads are below.',
  offSaleDownloadsPaused: "Downloads are paused while the Cadencea review team looks at a report. You'll keep your purchase.",
  barBuy: 'Buy',
  barGet: 'Get this pack',
  barChoose: 'Choose a license',
  barOwned: 'Download',
  sellerLabel: 'Seller',
} as const;

/** Toasts for demo actions the stores refuse. */
export const RESULT_COPY: Readonly<Record<string, string>> = {
  insufficient_credits: 'Demo: not enough credits in the demo wallet.',
  already_owned: 'Demo: this is already in the demo library.',
  downloaded: "Demo: a purchase you've downloaded can't be returned.",
  return_window_closed: 'Demo: the 14-day return window has closed.',
  fallback: "Demo: that didn't work. Reset the demo wallet on the Credits page and try again.",
};

/** §4.4 item 6: license summaries by license family. */
export const LICENSE_COPY = {
  title: 'License summary',
  canTitle: 'You can',
  cantTitle: "You can't",
  rfAsset: {
    can: [
      'Use these sounds in music you release, sell or stream, including commercial and client work.',
      'Chop, edit and process them however you like.',
    ],
    cant: [
      'Share or resell the files as they are, or put them in another sample pack, preset pack or library.',
      'Use them to train AI models.',
      'Register the raw sounds with Content ID.',
    ],
    note: 'Crediting the producer is welcome but not required.',
  },
  splits:
    "Use the loops in your songs. If you release one, the split terms above apply and Cadencea generates a split sheet. These loops are royalty-split, not royalty-free. You can't resell the loops or use them to train AI models.",
  beatLease:
    "Non-exclusive: the producer can keep leasing this beat. Stream caps as listed for your tier. The producer keeps 50% of the publishing and gets the credit 'prod. by {name}'. You can't register the beat with Content ID.",
  exclusiveTitle: 'Exclusive',
  exclusive:
    'The beat comes off sale for everyone else. No caps. You can register it with Content ID. Earlier lease holders keep their rights.',
  themePersonal: "Use it in Cadencea Vault on all your computers. Don't redistribute it.",
  footer: 'A plain-language summary of a draft license. A lawyer reviews the full license before the Market opens.',
} as const;

/** §4.4 BeatLicensePicker: the rights line per tier (CREDITS-MODEL §6.2). */
export const LEASE_RIGHTS = {
  wav: 'WAV, up to {streams} streams',
  stems: 'WAV and stems, up to {streams} streams',
  unlimited: 'WAV and stems, no caps',
  exclusive: 'The whole project goes to your vault and the beat is retired from sale',
} as const;

/** §4.5 */
export const SELLER_COPY = {
  reviewed: 'Reviewed seller',
  sellingSince: 'Selling since {date}',
  releases: '{n} releases',
  oneRelease: '1 release',
  tabsLabel: 'Releases by type',
  genresLabel: 'Genres',
  emptyTitle: 'Nothing on sale right now',
  emptyBody: 'Releases show up here once a person at Cadencea has reviewed them.',
} as const;
