/**
 * The one place a repository is chosen.
 *
 * No component, hook or store may construct one, and none may import a storage client
 * directly. In Phase 3 this is where SupabaseRepository appears behind an environment
 * flag, with the mock staying on as the offline fallback — and nothing else changes.
 */
import { MemoryStore, MockRepository } from '@es3/core';
import type { GameRepository } from '@es3/core';
import { IdbStore, idbAvailable } from './IdbStore.js';

export interface RepositoryHandle {
  repository: GameRepository;
  /** False when storage is unavailable — the session will not survive a reload. */
  durable: boolean;
}

export async function createRepository(): Promise<RepositoryHandle> {
  const durable = await idbAvailable();
  return {
    repository: new MockRepository({ store: durable ? new IdbStore() : new MemoryStore() }),
    durable,
  };
}
