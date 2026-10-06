/**
 * The picture of a retired kingdom (BRDC-HALL-004, handoff F-31): the map as it stood the
 * moment it was retired, a JPEG data URL taken by the client.
 *
 * One record for every image, kept through the season wipe beside the Hall itself — a
 * key per image would be cleared by the next retirement's `resetForSeason`. The Hall
 * entry carries only `image: true`, so listing the Hall never drags the pictures along.
 */
import type { KeyValueStore } from './kv.js';
import { K } from './keys.js';
import { readHallOfFame } from './hallOfFameStore.js';

export interface ChronicleImageApi {
  /** Keep this kingdom's picture and mark its Hall entry. A kingdom not in the Hall is ignored. */
  set(id: string, image: string): Promise<void>;
  /** The picture, or null if none was taken. */
  get(id: string): Promise<string | null>;
}

export function chronicleImageApi(store: () => KeyValueStore): ChronicleImageApi {
  return {
    async set(id, image) {
      const hall = await readHallOfFame(store());
      if (!hall.some((e) => e.id === id)) return;
      const images = (await store().get<Record<string, string>>(K.chronicleImages)) ?? {};
      await store().set(K.chronicleImages, { ...images, [id]: image });
      await store().set(K.hallOfFame, hall.map((e) => (e.id === id ? { ...e, image: true } : e)));
    },
    async get(id) {
      const images = await store().get<Record<string, string>>(K.chronicleImages);
      return images?.[id] ?? null;
    },
  };
}
