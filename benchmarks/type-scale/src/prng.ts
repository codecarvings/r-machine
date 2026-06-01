/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of r-machine, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

/**
 * Deterministic seeded PRNG (mulberry32). The whole benchmark must be
 * reproducible: same seed + same N => byte-identical generated project, so
 * compile/IntelliSense numbers are comparable across runs. We therefore never
 * touch Math.random().
 */
export class Prng {
  private state: number;

  constructor(seed: number) {
    // Avoid a zero state (mulberry32 degenerates).
    this.state = seed >>> 0 || 0x9e3779b9;
  }

  /** Next float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Pick one element. */
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)]!;
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Up to `count` distinct elements from `arr` (fewer if arr is smaller). */
  sample<T>(arr: readonly T[], count: number): T[] {
    if (count >= arr.length) {
      return [...arr];
    }
    const pool = [...arr];
    const out: T[] = [];
    for (let i = 0; i < count && pool.length > 0; i++) {
      out.push(pool.splice(this.int(0, pool.length - 1), 1)[0]!);
    }
    return out;
  }
}
