/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CookieDeclaration {
  readonly name: string;
  readonly path?: string | undefined;
  readonly httpOnly?: boolean | undefined;
  readonly secure?: boolean | undefined;
  readonly sameSite?: "lax" | "strict" | "none" | undefined;
  readonly maxAge?: number | undefined;
  readonly domain?: string | undefined;
}

export const defaultCookieDeclaration: CookieDeclaration = {
  name: "rm-locale",
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: "/",
};

export function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function setCookie(name: string, value: string, config: Omit<CookieDeclaration, "name">): void {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${config.path ?? "/"}`;
  if (config.domain !== undefined) {
    cookie += `; domain=${config.domain}`;
  }
  if (config.maxAge !== undefined) {
    cookie += `; max-age=${config.maxAge}`;
  }
  if (config.secure) {
    cookie += "; secure";
  }
  if (config.sameSite !== undefined) {
    cookie += `; samesite=${config.sameSite}`;
  }
  // biome-ignore lint: intentional native cookie management
  document.cookie = cookie;
}
