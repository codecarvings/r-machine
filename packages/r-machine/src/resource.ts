export interface $Resources {
  readonly [key: string]: object;
}

export type NamespaceOf<RS extends $Resources> = keyof RS;
