import { RMachineError } from "#r-machine/errors";
import { DomainManager } from "./domain-manager.js";
import { LocaleHelper } from "./locale-helper.js";
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
    this.localeHelper = new LocaleHelper(this.config.locales, this.config.defaultLocale);
    this.domainManager = new DomainManager(config.rModuleResolver);
  }

  readonly config: RMachineConfig;
  readonly localeHelper: LocaleHelper;
  protected readonly domainManager: DomainManager;

  protected validateLocaleForPick(locale: string) {
    const error = this.localeHelper.validateLocale(locale);
    if (error) {
      throw new RMachineError(`Cannot use invalid locale: "${locale}".`, error);
    }
  }

  // Required for react suspense support
  readonly hybridPickR = <N extends AtlasNamespace<A>>(locale: string, namespace: N): A[N] | Promise<A[N]> => {
    this.validateLocaleForPick(locale);
    const domain = this.domainManager.getDomain(locale);
    return domain.hybridPickR(namespace) as A[N] | Promise<A[N]>;
  };

  readonly pickR = <N extends AtlasNamespace<A>>(locale: string, namespace: N): Promise<A[N]> => {
    this.validateLocaleForPick(locale);
    const domain = this.domainManager.getDomain(locale);
    return domain.pickR(namespace) as Promise<A[N]>;
  };

  // Required for react suspense support
  readonly hybridPickRKit = <NL extends AtlasNamespaceList<A>>(
    locale: string,
    ...namespaces: NL
  ): RKit<A, NL> | Promise<RKit<A, NL>> => {
    this.validateLocaleForPick(locale);
    const domain = this.domainManager.getDomain(locale);
    return domain.hybridPickRKit(namespaces) as RKit<A, NL> | Promise<RKit<A, NL>>;
  };

  readonly pickRKit = <NL extends AtlasNamespaceList<A>>(locale: string, ...namespaces: NL): Promise<RKit<A, NL>> => {
    this.validateLocaleForPick(locale);
    const domain = this.domainManager.getDomain(locale);
    return domain.pickRKit(namespaces) as Promise<RKit<A, NL>>;
  };
}
