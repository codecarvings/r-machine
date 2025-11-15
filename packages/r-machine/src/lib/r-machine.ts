import { DomainManager } from "./domain-manager.js";
import { LocaleHelper } from "./locale-helper.js";
import { LocaleMapperManager } from "./locale-mapper-manager.js";
import type { AnyAtlas, AtlasNamespace } from "./r.js";
import type { AtlasNamespaceList, RKit } from "./r-kit.js";
import { cloneRMachineConfig, type RMachineConfig, validateRMachineConfig } from "./r-machine-config.js";

export class RMachine<A extends AnyAtlas> {
  constructor(config: RMachineConfig) {
    const configError = validateRMachineConfig(config);
    if (configError) {
      throw configError;
    }
    this.config = cloneRMachineConfig(config);
    this.localeMapperManager = new LocaleMapperManager(config.locales, config.defaultLocale, config.localeMapper);
    this.domainManager = new DomainManager(config.rModuleResolver);

    this.localeHelper = new LocaleHelper(
      this.config.locales,
      this.config.defaultLocale,
      this.localeMapperManager.mapLocale
    );
  }

  readonly config: RMachineConfig;
  protected readonly localeMapperManager: LocaleMapperManager;
  protected readonly domainManager: DomainManager;

  readonly localeHelper: LocaleHelper;

  // Required for react suspense support
  readonly hybridPickR = <N extends AtlasNamespace<A>>(locale: string, namespace: N): A[N] | Promise<A[N]> => {
    const mappedLocale = this.localeMapperManager.mapLocale(locale);
    const domain = this.domainManager.getDomain(mappedLocale);
    return domain.hybridPickR(namespace) as A[N] | Promise<A[N]>;
  };

  readonly pickR = <N extends AtlasNamespace<A>>(locale: string, namespace: N): Promise<A[N]> => {
    const mappedLocale = this.localeMapperManager.mapLocale(locale);
    const domain = this.domainManager.getDomain(mappedLocale);
    return domain.pickR(namespace) as Promise<A[N]>;
  };

  // Required for react suspense support
  readonly hybridPickRKit = <NL extends AtlasNamespaceList<A>>(
    locale: string,
    ...namespaces: NL
  ): RKit<A, NL> | Promise<RKit<A, NL>> => {
    const mappedLocale = this.localeMapperManager.mapLocale(locale);
    const domain = this.domainManager.getDomain(mappedLocale);
    return domain.hybridPickRKit(namespaces) as RKit<A, NL> | Promise<RKit<A, NL>>;
  };

  readonly pickRKit = <NL extends AtlasNamespaceList<A>>(locale: string, ...namespaces: NL): Promise<RKit<A, NL>> => {
    const mappedLocale = this.localeMapperManager.mapLocale(locale);
    const domain = this.domainManager.getDomain(mappedLocale);
    return domain.pickRKit(namespaces) as Promise<RKit<A, NL>>;
  };
}
