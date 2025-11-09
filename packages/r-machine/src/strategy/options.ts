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
