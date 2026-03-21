import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "#r-machine/errors";
import type { AnyLocale, AnyLocaleList, LocaleList } from "#r-machine/locale";
import { LocaleHelper } from "#r-machine/locale";
import { DomainManager } from "./domain-manager.js";
import type {
  AnyFmtGetter,
  AnyFmtProvider,
  AnyFmtProviderCtor,
  ExtractFmt,
  ExtractFmtGetter,
  ExtractFmtProvider,
  ExtractFmtProviderCtor,
} from "./fmt.js";
import type { AnyResourceAtlas, Namespace } from "./r.js";
import type { NamespaceList, RKit } from "./r-kit.js";
import {
  cloneRMachineExtensions,
  type RMachineBuilder,
  type RMachineExtendedBuilder,
  type RMachineExtensions,
} from "./r-machine-builder.js";
import {
  cloneRMachineConfig,
  type RMachineConfig,
  type RMachineConfigParams,
  validateRMachineConfig,
} from "./r-machine-config.js";
import type { RCtx } from "./r-module.js";

export class RMachine<RA extends AnyResourceAtlas, L extends AnyLocale, FP extends AnyFmtProvider> {
  constructor(config: RMachineConfig<L>, extensions: RMachineExtensions<ExtractFmtProviderCtor<FP>>) {
    const configError = validateRMachineConfig(config);
    if (configError) {
      throw configError;
    }
    this.config = cloneRMachineConfig(config);
    this.locales = this.config.locales;
    this.defaultLocale = this.config.defaultLocale;
    this.localeHelper = new LocaleHelper(this.config.locales, this.config.defaultLocale);
    this.domainManager = new DomainManager(config.rModuleResolver, extensions?.Formatters?.get as AnyFmtGetter);
    this.extensions = cloneRMachineExtensions(extensions);

    if (this.extensions?.Formatters) {
      this.fmt = ((locale: L) => {
        this.validateLocaleForPick(locale);
        return this.extensions!.Formatters!.get(locale);
      }) as ExtractFmt<FP>;
    } else {
      this.fmt = undefined as ExtractFmt<FP>;
    }
  }

  readonly locales: LocaleList<L>;
  readonly defaultLocale: L;
  readonly localeHelper: LocaleHelper<L>;
  protected readonly config: RMachineConfig<L>;
  protected readonly domainManager: DomainManager;
  protected readonly extensions: RMachineExtensions<ExtractFmtProviderCtor<FP>>;

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

  readonly fmt: ExtractFmtGetter<FP>;

  static builder<const LL extends AnyLocaleList>(config: RMachineConfigParams<LL>): RMachineBuilder<LL[number]> {
    return {
      with<C extends AnyFmtProviderCtor>(
        extensions: RMachineExtensions<C>
      ): RMachineExtendedBuilder<LL[number], ExtractFmtProvider<C>> {
        return {
          create<RA extends AnyResourceAtlas>(): RMachine<RA, LL[number], ExtractFmtProvider<C>> {
            return new RMachine(
              config,
              // Safe cast: TS cannot prove the round-trip identity
              // ExtractFmtProviderCtor<ExtractFmtProvider<C>> ≡ C,
              // but it holds for any C extends AnyFmtProviderCtor.
              extensions as unknown as RMachineExtensions<ExtractFmtProviderCtor<ExtractFmtProvider<C>>>
            );
          },
        };
      },
      create<RA extends AnyResourceAtlas>(): RMachine<RA, LL[number], undefined> {
        return new RMachine(config, {});
      },
    };
  }
}

export type RMachineLocale<T> =
  T extends RMachine<any, infer L, any>
    ? L
    : T extends RMachineBuilder<infer L>
      ? L
      : T extends RMachineExtendedBuilder<infer L, any>
        ? L
        : never;

export type RMachineRCtx<T> =
  T extends RMachineExtendedBuilder<infer L, infer FP>
    ? RCtx<L, FP>
    : T extends RMachineBuilder<infer L>
      ? RCtx<L, undefined>
      : never;
