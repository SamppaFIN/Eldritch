/**
 * Player-facing switches, kept in one small localStorage record.
 *
 * Sound and vibration only, for now. This is exactly the "small, bounded state" that
 * `persist/save.ts` documents itself for — one key, one shape, no growth — so it rides
 * the same `saveNow`/`load` helpers as the session and the Hearth mark, not IndexedDB.
 */
import { load, saveNow } from '@es3/core';

export interface Settings {
  sound: boolean;
  vibration: boolean;
  /**
   * Claim territory by closing a loop (BRDC-CLAIM-009). Off by default for now: ground is
   * taken by walking into it, one hex at a time. The loop comes back as it is taught.
   */
  loopClosure: boolean;
  /**
   * Draw every Work as its own isometric icon on the map (BRDC-ART-003). Off falls back
   * to ART-002's single role glyph per cell. The map's first filter — more will follow.
   */
  buildingIcons: boolean;
  /**
   * Trade the glass for an opaque plate (Sigil §02, "daylight mode").
   *
   * Direct sun is the one condition a translucent pane cannot win, and this game is
   * played in it. The flip drops the blur entirely and swaps the tint for `--plate` at
   * 0.94 alpha — same geometry, same type, same hues, and no GPU cost. It doubles as the
   * answer for a failing battery.
   */
  daylight: boolean;
  /**
   * Show a rival cell's full detail — strength, decay, where it was seen from
   * (BRDC-WAGER-JSON-007). Off leaves a rival cell as "held by another" and the red
   * ring. On by default: among friends, the point is to see each other's reach.
   */
  revealRivals: boolean;
  /**
   * Take part in the shared world (BRDC-SHARE-002): fetch other realms near you, and show
   * the button that publishes yours. Off by default — nothing leaves the device, and
   * nothing is fetched, until the player opts in.
   */
  shareWorld: boolean;
  /** What each hex of yours makes, drawn on it at street zoom (BRDC-MAP-008). On by default. */
  yieldOverlay: boolean;
  /**
   * Every page and button at once, instead of opening them as the Keeper's Charter reaches
   * them (BRDC-ONBOARD-005). Off by default: the first days are simpler without.
   */
  showEverything: boolean;
}

const KEY = 'settings';

/** Sound and vibration on (the claim chime is a reward, not a nag); the loop off for now;
 *  building icons on, since the field asked to see the buildings. */
export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  vibration: true,
  loopClosure: false,
  buildingIcons: true,
  daylight: false,
  revealRivals: true,
  shareWorld: false,
  yieldOverlay: true,
  showEverything: false,
};

export function loadSettings(): Settings {
  const stored = load<Partial<Settings>>(KEY, DEFAULT_SETTINGS);
  return {
    sound: stored.sound ?? DEFAULT_SETTINGS.sound,
    vibration: stored.vibration ?? DEFAULT_SETTINGS.vibration,
    loopClosure: stored.loopClosure ?? DEFAULT_SETTINGS.loopClosure,
    buildingIcons: stored.buildingIcons ?? DEFAULT_SETTINGS.buildingIcons,
    daylight: stored.daylight ?? DEFAULT_SETTINGS.daylight,
    revealRivals: stored.revealRivals ?? DEFAULT_SETTINGS.revealRivals,
    shareWorld: stored.shareWorld ?? DEFAULT_SETTINGS.shareWorld,
    yieldOverlay: stored.yieldOverlay ?? DEFAULT_SETTINGS.yieldOverlay,
    showEverything: stored.showEverything ?? DEFAULT_SETTINGS.showEverything,
  };
}

export function saveSettings(next: Settings): void {
  saveNow(KEY, next);
}
