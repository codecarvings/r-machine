import type { AnyLocale } from "#r-machine";

// Use strings instead of booleans for better clarity in config and for better DX with intellisense
export type SwitchableOption = "off" | "on";

export type CustomLocaleDetector = () => AnyLocale | Promise<AnyLocale>;

export interface CustomLocaleStore {
  readonly get: () => AnyLocale | undefined | Promise<AnyLocale | undefined>;
  readonly set: (newLocale: AnyLocale) => void | Promise<void>;
}
