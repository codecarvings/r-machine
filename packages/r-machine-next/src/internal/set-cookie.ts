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

import Cookies from "js-cookie";
import type { CookieDeclaration } from "r-machine/strategy/web";

export function setCookie(name: string, value: string, config: Omit<CookieDeclaration, "name">): void {
  Cookies.set(name, value, {
    domain: config.domain,
    path: config.path ?? "/", // Ensure cookie is set for the root path if no path is specified (otherwise it is set for the current path)
    expires: config.maxAge !== undefined ? new Date(Date.now() + config.maxAge * 1000) : undefined,
    secure: config.secure,
    sameSite: config.sameSite,
  });
}
