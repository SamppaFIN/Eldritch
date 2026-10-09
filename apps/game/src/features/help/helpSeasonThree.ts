/**
 * The Guide's pages for Season 3 (the 4X + Arkham round) — one per new mechanic, and one
 * that says what is new. Always in the Guide (`encountered.ts`): they are the instructions
 * for the season, not a reward for having met them. Kept apart from `help.ts` so neither
 * file outgrows its line ceiling. Numbers here are the game's own — change one there,
 * change it here.
 */
import type { HelpEntry } from './help.js';

export type SeasonThreeTopic =
  | 'season-3'
  | 'ambition'
  | 'ages'
  | 'eureka'
  | 'neighbours'
  | 'golden-week'
  | 'mythos'
  | 'dreams'
  | 'chimneys'
  | 'great-people'
  | 'trade-routes'
  | 'villages'
  | 'the-book'
  | 'the-stranger'
  | 'drowned-choir'
  | 'skyward-runway'
  | 'other-world'
  | 'terror'
  | 'mysteries'
  | 'creatures'
  | 'conditions'
  | 'allies';

export const SEASON_THREE_HELP: Readonly<Record<SeasonThreeTopic, HelpEntry>> = {
  'season-3': {
    title: 'What Is New This Season',
    body: [
      'Walking still claims, and the Keep is still your home. What changes is how much there is to do with what you hold.',
      'Your realm: choose an ambition, choose who you become at each new Age, earn great people, walk trade routes, win a village.',
      'The town: a shared terror, three mysteries everyone solves together, and creatures that walk out of the gates.',
      'Each of those has its own page here. Read one when you meet the thing — the game will not quiz you.',
    ],
    see: ['ambition', 'golden-week', 'great-people', 'other-world', 'mysteries'],
  },
  ambition: {
    title: 'The Season’s Ambition',
    body: [
      'Once a season, in the Keep, choose how you want to be remembered: hold three temples, seal ten gates, or hold two hundred hexes.',
      'Met when the season closes, it multiplies your Legacy by 1.15. You cannot change it, so choosing takes two taps.',
    ],
    see: ['season-3'],
  },
  ages: {
    title: 'Who the Realm Became',
    body: [
      'Learn three of an Age’s four Lore and you enter the next Age. Each time, the Lore asks who your realm has become: Merchants (+2 gold an hour), Wardens (+1 stone and +1 timber) or Seers (+1 wisdom and +1 mana).',
      'The choice is for good, and the Hall of Fame keeps the chain — “Merchants → Seers”.',
    ],
    see: ['eureka'],
  },
  eureka: {
    title: 'Eurekas',
    body: [
      'Every Lore has a thing you can do on foot — hold forest, raise a Market, reveal ground. Do it, and that Lore costs half its wisdom.',
      'A card says so once. The Lore lists every eureka and how far along you are.',
    ],
    see: ['ages'],
  },
  neighbours: {
    title: 'Neighbours',
    body: [
      'Where a Work stands matters. A Farm beside water makes 1 food more. A Work beside others of its kind makes 1 more for each, up to 2. A Library beside a temple makes 2 wisdom more.',
      'The hex card shows these as their own lines, and the build menu says before you build.',
    ],
  },
  'golden-week': {
    title: 'Golden and Dark Weeks',
    body: [
      'On Monday the game compares what last week added to your Legacy with the week before. A fifth more makes a golden week: everything you make comes a tenth faster, and you choose one boon in the Keep.',
      'Four-tenths less makes a dark week: a tenth slower — but it leaves a promise, and your next golden week only has to match the week before.',
      'The first two weeks of a season are always ordinary, and a week away starts the count over.',
    ],
  },
  mythos: {
    title: 'The Mythos',
    body: [
      'Every day the season deals one Mythos card: news from the lake, read once as a card at the top of the screen and kept in the Keep.',
      'Some cards change a test’s dice, what a Farm or Market makes, or your realm’s rate for the day. Over three days they tell a story.',
    ],
    see: ['terror'],
  },
  dreams: {
    title: 'Dreams',
    body: [
      'Sleep where you were last seen — six hours or more — and open the game in the morning, between five and eleven. A dream is waiting.',
      'Tap it to face it on Will. A good dream leaves a clue or something useful; a bad one costs sanity. One a night, and it needs your Keep.',
    ],
  },
  chimneys: {
    title: 'The Chimneys',
    body: [
      'Three factory chimneys stand around Härmälä. Each is a landmark: hold its hex and it pays culture.',
      'Hold all three and they light as beacons. The fog lifts for about a kilometre around them, for good.',
    ],
  },
  'great-people': {
    title: 'Great People',
    body: [
      'A Library gathers points for a Scholar, a Market for a Merchant, a Temple Grove for a Mystic — one point an hour each, if hands work there.',
      'At 100 points a named person is born, each next one of a kind costing 50 more. Each has one great deed, used once from the Keep: a Scholar sees three rings around your Hearth, a Merchant brings in a whole day’s making, a Mystic seals the nearest gate.',
    ],
  },
  'trade-routes': {
    title: 'Trade Routes',
    body: [
      'Walk from one of your Markets to another, or to a village’s quay, in one walk: under two kilometres, without stopping half an hour. That road becomes a trade route.',
      'It pays 2 gold an hour and 1 more for every kilometre, for as long as its Markets are yours. Your Lands list every route under Routes, and the map draws them in gold.',
    ],
    see: ['villages'],
  },
  villages: {
    title: 'Villages and Envoys',
    body: [
      'Härmälänranta has tasks of its own, at its quay below the trade post. Each one done sends envoys.',
      'Whoever has sent the most — at least three, and not tied — is the village’s suzerain and gets its catch: 4 food an hour.',
    ],
    see: ['trade-routes'],
  },
  'the-book': {
    title: 'The Book That Came Back',
    body: [
      'Ten pages of Agnes’s book are out on the ground. Passing a rumour or finishing an anomaly sometimes turns one up.',
      'Read a page in the Keep and its rite is yours without a temple — or a rank deeper. Every page read costs a point of sanity for good, and a mind holds five. Choose which.',
    ],
  },
  'the-stranger': {
    title: 'The Stranger in Many Masks',
    body: [
      'Some rumours are the same stranger in a different coat. Watch his shadow — it always leans toward the lake.',
      'Meet three of his masks and the Keep lets you name him. A wrong name costs two sanity. The right one lets you bargain with him or banish him.',
    ],
  },
  'drowned-choir': {
    title: 'The Drowned Choir',
    body: [
      'A choir sings under Pyhäjärvi. Its rumours turn up on lake and coast, and its tale hangs on the Tavern board, one step at a time.',
      'When the Reckoning comes the lake rises: lake and coast hexes make half until the tale is finished. Its steps cannot fail, so you can always end it.',
    ],
  },
  'skyward-runway': {
    title: 'The Skyward Runway',
    body: [
      'Finish the Fuming Lake and its sequel opens at the old hangar on the Härmälä airfield: five stops, and the statue’s propeller.',
      'The end leaves the propeller in your hand. In the Keep it seals one open gate from afar, whenever you choose.',
    ],
  },
  'other-world': {
    title: 'Through a Gate',
    body: [
      'Standing on an open gate, you may step through instead of facing it from outside. Every gate opens on one world — the Dreamlands, Far Pyhäjärvi or the Outer Air.',
      'Two encounters wait there, one test each. Pass both and the gate closes behind you, with clues. Fail one and you are thrown back with a condition, and the gate stays open. A journey left half-way waits for you.',
    ],
    see: ['creatures', 'conditions'],
  },
  terror: {
    title: 'The Town’s Terror',
    body: [
      'The whole town shares one terror, from 0 to 10. A gate left open two days raises it; a gate sealed lowers it. The walking sheet says it when it rises.',
      'At 5 the villages drive harder bargains. At 8 every Market makes a quarter less. Seal gates and it falls again.',
    ],
    see: ['mysteries'],
  },
  mysteries: {
    title: 'The Three Mysteries',
    body: [
      'The season has three mysteries, and everyone solves them together: 30 clues gathered or 5 gates sealed across all realms solves one, whichever comes first.',
      'Each one solved opens a chapter in the Keep for everyone — and makes the Ancient One a fifth weaker when the Reckoning comes.',
    ],
    see: ['terror'],
  },
  creatures: {
    title: 'Creatures That Walk',
    body: [
      'About one gate in two lets something out. It walks toward your Hearth, a ring a day, and where it crosses your ground the hex loses 50 strength.',
      'Stand on its hex and face it on Vigor to stop it. Left alone, it wanders off after a week. You only see it near ground you can see.',
    ],
    see: ['other-world'],
  },
  conditions: {
    title: 'Conditions',
    body: [
      'A test gone wrong can leave a lasting condition. Debt: pay 50 gold within three days or lose your weakest hex. Paranoia: Wit tests roll a die fewer until you walk your Hearth. Cursed: only a 6 succeeds until you walk a temple.',
      'Amnesia stops clue rerolls for a day. Blessed makes a 4 succeed. A Dark Pact gives Lore two dice more — and takes 3 sanity when it ends. Your investigator’s own weakness comes over them below 3 sanity.',
    ],
    see: ['allies'],
  },
  allies: {
    title: 'Allies and Your Own Tale',
    body: [
      'Some tasks end with a friend: Cornelius gives a die on Lore, Grug a die on Vigor, the Wandering Merchant makes Works 10 % cheaper. One walks with you at a time; a new one asks first.',
      'Your investigator has a tale of their own, three steps on their card in the Keep. Finishing it raises their skill, and the Hall remembers it.',
    ],
    see: ['conditions'],
  },
};

/** The Guide's Season 3 group, in the order a player meets them. */
export const SEASON_THREE_TOPICS: readonly SeasonThreeTopic[] = [
  'season-3', 'ambition', 'golden-week', 'ages', 'eureka', 'neighbours', 'mythos', 'dreams', 'chimneys',
  'great-people', 'trade-routes', 'villages', 'the-book', 'the-stranger', 'drowned-choir', 'skyward-runway',
  'other-world', 'terror', 'mysteries', 'creatures', 'conditions', 'allies',
];
