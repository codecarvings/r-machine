import { DomainManager } from "./domain-manager.js";
import { type MatchLocalesAlgorithm, matchLocales } from "./locale/locale-matcher.js";
import { LocaleMapperManager } from "./locale-mapper-manager.js";
import type { AnyAtlas, AtlasNamespace } from "./r.js";
import type { AtlasNamespaceList, RKit } from "./r-kit.js";
import {
  cloneRMachineConfig,
  type LocaleMapper,
  type RMachineConfig,
  validateRMachineConfig,
} from "./r-machine-config.js";

export class RMachine<A extends AnyAtlas> {
  constructor(config: RMachineConfig) {
    const configError = validateRMachineConfig(config);
    if (configError) {
      throw configError;
    }
    this.config = cloneRMachineConfig(config);
    this.localeMapperManager = new LocaleMapperManager(config.locales, config.defaultLocale, config.localeMapper);
    this.domainManager = new DomainManager(config.rModuleResolver);

    this.mapLocale = this.localeMapperManager.map;
  }

  readonly config: RMachineConfig;
  protected readonly localeMapperManager: LocaleMapperManager;
  protected readonly domainManager: DomainManager;

  readonly matchLocales = (requestedLocales: readonly string[], algorithm?: MatchLocalesAlgorithm): string => {
    return matchLocales(requestedLocales, this.config.locales, this.config.defaultLocale, { algorithm });
  };

  readonly mapLocale: LocaleMapper;

  // Can return a promise or a value
  // This is to make suspense work with react on client
  readonly pickR = <N extends AtlasNamespace<A>>(locale: string, namespace: N): A[N] | Promise<A[N]> => {
    const mappedLocale = this.mapLocale(locale);
    const domain = this.domainManager.get(mappedLocale);
    return domain.pickR(namespace) as A[N] | Promise<A[N]>;
  };

  // Can return a promise or a value
  // This is to make suspense work with react on client
  readonly pickRKit = <NL extends AtlasNamespaceList<A>>(
    locale: string,
    ...namespaces: NL
  ): RKit<A, NL> | Promise<RKit<A, NL>> => {
    const mappedLocale = this.mapLocale(locale);
    const domain = this.domainManager.get(mappedLocale);
    return domain.pickRKit(...namespaces) as RKit<A, NL> | Promise<RKit<A, NL>>;
  };
}
