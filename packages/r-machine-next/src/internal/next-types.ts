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

import type { cookies, headers } from "next/headers";
import type { NextFetchEvent, NextRequest, NextResponse } from "next/server";

// *** Next.js types for internal use in r-machine-next package ***

export type HeadersFn = typeof headers;
export type CookiesFn = typeof cookies;

// biome-ignore lint/suspicious/noConfusingVoidType: Use exact type definition from Next.js
export type NextProxyResult = NextResponse | Response | null | undefined | void;
export type NextProxy = (request: NextRequest, event: NextFetchEvent) => NextProxyResult | Promise<NextProxyResult>;
