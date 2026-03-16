import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "#r-machine/errors";
import { DomainManager } from "./domain-manager.js";
import type { AnyLocale, AnyLocaleList } from "./locale.js";
import { LocaleHelper } from "./locale-helper.js";
import type { AnyResourceAtlas, Namespace } from "./r.js";
import type { NamespaceList, RKit } from "./r-kit.js";
import {
  cloneRMachineConfig,
  type RMachineConfig,
  type RMachineConfigParams,
  validateRMachineConfig,
} from "./r-machine-config.js";

export class RMachine<const RA extends AnyResourceAtlas, const L extends AnyLocale> {
  protected constructor(config: RMachineConfig<L>) {
    const configError = validateRMachineConfig(config);
    if (configError) {
      throw configError;
    }
    this.config = cloneRMachineConfig(config);
    this.localeHelper = new LocaleHelper(this.config.locales, this.config.defaultLocale);
    this.domainManager = new DomainManager(config.rModuleResolver);
  }

  readonly config: RMachineConfig<L>;
  readonly localeHelper: LocaleHelper;
  protected readonly domainManager: DomainManager;

  protected validateLocaleForPick(locale: L) {
    const error = this.localeHelper.validateLocale(locale);
    if (error) {
      throw new RMachineUsageError(ERR_UNKNOWN_LOCALE, `Cannot use invalid locale: "${locale}".`, error);
    }
  }

  // Use property syntax to bind 'this' correctly
  readonly pickR = <N extends Namespace<RA>>(locale: L, namespace: N): Promise<RA[N]> => {
    this.validateLocaleForPick(locale);
    const domain = this.domainManager.getDomain(locale);
    return domain.pickR(namespace) as Promise<RA[N]>;
  };

  // Required for react suspense support
  protected readonly hybridPickR = <N extends Namespace<RA>>(locale: L, namespace: N): RA[N] | Promise<RA[N]> => {
    this.validateLocaleForPick(locale);
    const domain = this.domainManager.getDomain(locale);
    return domain.hybridPickR(namespace) as RA[N] | Promise<RA[N]>;
  };

  readonly pickRKit = <NL extends NamespaceList<RA>>(locale: L, ...namespaces: NL): Promise<RKit<RA, NL>> => {
    this.validateLocaleForPick(locale);
    const domain = this.domainManager.getDomain(locale);
    return domain.pickRKit(namespaces) as Promise<RKit<RA, NL>>;
  };

  // Required for react suspense support
  protected readonly hybridPickRKit = <NL extends NamespaceList<RA>>(
    locale: L,
    ...namespaces: NL
  ): RKit<RA, NL> | Promise<RKit<RA, NL>> => {
    this.validateLocaleForPick(locale);
    const domain = this.domainManager.getDomain(locale);
    return domain.hybridPickRKit(namespaces) as RKit<RA, NL> | Promise<RKit<RA, NL>>;
  };

  static for<RA extends AnyResourceAtlas>(): RMachineCurriedBuilder<RA> {
    return {
      create: <const LL extends AnyLocaleList>(config: RMachineConfigParams<LL>): RMachine<RA, LL[number]> => {
        return new RMachine(config as RMachineConfig<LL[number]>);
      },
    };
  }
}

interface RMachineCurriedBuilder<RA extends AnyResourceAtlas> {
  create: <const LL extends AnyLocaleList>(config: RMachineConfigParams<LL>) => RMachine<RA, LL[number]>;
}

export type RMachineLocale<RM extends RMachine<any, any>> = RM extends RMachine<any, infer L> ? L : never;
