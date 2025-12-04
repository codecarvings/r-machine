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
