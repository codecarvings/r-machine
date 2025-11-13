// Use strings instead of booleans for better clarity in config and for better DX with intellisense
export type SwitchableOption = "off" | "on";

export type CustomLocaleDetector = () => string | Promise<string>;

export interface CustomLocaleStore {
  readonly get: () => string | undefined | Promise<string | undefined>;
  readonly set: (newLocale: string) => void | Promise<void>;
}

export interface CookieDeclaration {
  readonly name: string;
  readonly path?: string | undefined;
  readonly httpOnly?: boolean | undefined;
  readonly secure?: boolean | undefined;
  readonly sameSite?: "lax" | "strict" | "none" | undefined;
  readonly maxAge?: number | undefined;
  readonly domain?: string | undefined;
}

export type CookieOption = SwitchableOption | CookieDeclaration;

export const defaultCookieDeclaration: CookieDeclaration = {
  name: "rm-locale",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};
