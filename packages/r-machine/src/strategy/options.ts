// Use strings instead of booleans for better clarity in config and for better DX with intellisense
export type SwitchableOption = "off" | "on";

export type CustomLocaleDetector = () => string | Promise<string>;

export interface CustomLocaleStore {
  readonly get: () => string | undefined | Promise<string | undefined>;
  readonly set: (newLocale: string) => void | Promise<void>;
}
