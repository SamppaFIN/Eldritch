/**
 * The number the menu and the bug report print must be the build's own.
 *
 * `APP_VERSION` sat at 0.5.87 while the changelog reached 0.6.61 — every field report
 * carried a version from weeks ago, and the menu told the player they were on it. The
 * changelog's top entry is bumped with every release, so it is what this is held to.
 */
import { describe, expect, it } from 'vitest';
import { APP_VERSION } from '@es3/core';
import changelog from './changelog.json';

describe('APP_VERSION', () => {
  it('is the version the changelog last shipped', () => {
    expect(APP_VERSION).toBe(changelog[0]?.version);
  });
});
