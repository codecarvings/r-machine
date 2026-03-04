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

// Matches all routes except:
// - Common system routes: `/_next`, `/_vercel`, `/api`
// - Requests ending with a file extension (e.g., `.js`, `.css`, `.png`, etc.)
export const defaultPathMatcher: RegExp = /^\/(?!(?:_next|_vercel|api)(?:\/|$)|.*\.[^/]+$)/;
