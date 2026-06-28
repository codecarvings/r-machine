/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/next, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

// Intentionally empty.
//
// This module is the alias target for `server-only` under the jiti dev
// loader (see `create-next-dev-import.ts`). The real `server-only` package
// throws on import to fence server code out of client bundles; jiti has no
// such bundle boundary, so importing it would crash resource-module loads
// during dev HMR. Pointing the alias at an empty barrel turns the import
// into a harmless no-op while keeping the original `import "server-only"`
// statements untouched in user code (where Next still enforces them at
// build time).
export {};
