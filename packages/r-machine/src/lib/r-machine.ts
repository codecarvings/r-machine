import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "#r-machine/errors";
import type { AnyLocale, AnyLocaleList } from "#r-machine/locale";
import { LocaleHelper } from "#r-machine/locale";
import { DomainManager } from "./domain-manager.js";
import type { AnyResourceAtlas, Namespace } from "./r.js";
import type { NamespaceList, RKit } from "./r-kit.js";
import {
  cloneRMachineConfig,
  type RMachineConfig,
  type RMachineConfigParams,
  validateRMachineConfig,
} from "./r-machine-config.js";
import type { R$ } from "./r-module.js";

export class RMachine<const RA extends AnyResourceAtlas, const L extends AnyLocale> {
  constructor(config: RMachineConfig<L>, formatters?: (locale: AnyLocale) => object) {
    const configError = validateRMachineConfig(config);
    if (configError) {
      throw configError;
    }
    this.config = cloneRMachineConfig(config);
    this.localeHelper = new LocaleHelper(this.config.locales, this.config.defaultLocale);
    this.domainManager = new DomainManager(config.rModuleResolver, formatters);
  }

  readonly config: RMachineConfig<L>;
  readonly localeHelper: LocaleHelper<L>;
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

  static builder<const LL extends AnyLocaleList>(config: RMachineConfigParams<LL>): RMachineBuilder<LL> {
    return {
      with<F extends (locale: LL[number]) => object>(options: { formatters: F }): RMachineSetup<LL, F> {
        return {
          create<RA extends AnyResourceAtlas>(): RMachine<RA, LL[number]> {
            return new RMachine(
              config as RMachineConfig<LL[number]>,
              options.formatters as (locale: AnyLocale) => object
            );
          },
        };
      },
      create<RA extends AnyResourceAtlas>(): RMachine<RA, LL[number]> {
        return new RMachine(config as RMachineConfig<LL[number]>);
      },
    };
  }
}

export interface RMachineBuilder<LL extends AnyLocaleList> {
  with<F extends (locale: LL[number]) => object>(options: { formatters: F }): RMachineSetup<LL, F>;
  create<RA extends AnyResourceAtlas>(): RMachine<RA, LL[number]>;
}

export interface RMachineSetup<LL extends AnyLocaleList, F extends (locale: LL[number]) => object> {
  readonly _brand?: F;
  create<RA extends AnyResourceAtlas>(): RMachine<RA, LL[number]>;
}

export type RMachineLocale<T> =
  T extends RMachine<any, infer L>
    ? L
    : T extends RMachineBuilder<infer LL>
      ? LL[number]
      : T extends RMachineSetup<infer LL, any>
        ? LL[number]
        : never;

export type RMachineR$<T> =
  T extends RMachineSetup<infer LL, infer F>
    ? R$<LL[number], ReturnType<F>>
    : T extends RMachineBuilder<infer LL>
      ? R$<LL[number], undefined>
      : never;
