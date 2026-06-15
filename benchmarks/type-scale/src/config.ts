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

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** Benchmark package root (the dir holding package.json). */
export const PKG_ROOT = resolve(here, "..");
export const GENERATED_ROOT = resolve(PKG_ROOT, "generated");
export const RESULTS_ROOT = resolve(PKG_ROOT, "results");

/** Resource-count scale points. Same seed + N => identical project. */
export const SCALE_POINTS = [10, 25, 50, 100, 250, 500] as const;

/** Trace analysis is costly; only run it for the larger projects. */
export const TRACE_POINTS = [250, 500] as const;

/** Fixed seed: reproducible generation across machines and runs. */
export const SEED = 0x5eed;

/** Per-marker IntelliSense sampling. */
export const IS_SAMPLES = 15;
export const IS_WARMUP = 3;

export function projectDir(n: number): string {
  return resolve(GENERATED_ROOT, String(n));
}
