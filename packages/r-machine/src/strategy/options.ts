export type CustomLocaleDetector = () => string;

export interface CustomLocaleStore {
  readonly get: () => string | undefined;
  readonly set: (newLocale: string) => void;
}
