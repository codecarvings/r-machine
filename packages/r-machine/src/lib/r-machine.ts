/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of r-machine, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "#r-machine/errors";
import type { AnyLocale, AnyLocaleList, LocaleList } from "#r-machine/locale";
import { LocaleHelper } from "#r-machine/locale";
import { DomainManager } from "./domain-manager.js";
import type { AnyFmtProvider, AnyFmtProviderCtor, EmptyFmtProvider, ExtractFmt, FmtGetter } from "./fmt.js";
import type { AnyResourceAtlas, Namespace } from "./r.js";
import type { NamespaceList, RKit } from "./r-kit.js";
import {
  cloneRMachineExtensions,
  defaultRMachineExtensions,
  type PartialRMachineExtensions,
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
  constructor(config: RMachineConfig<L>, extensions: RMachineExtensions<FP>) {
    const configError = validateRMachineConfig(config);
    if (configError) {
      throw configError;
    }
    this.config = cloneRMachineConfig(config);
    this.locales = this.config.locales;
    this.defaultLocale = this.config.defaultLocale;
    this.localeHelper = new LocaleHelper(this.config.locales, this.config.defaultLocale);
    this.domainManager = new DomainManager(config.rModuleResolver, extensions.Formatters.get);
    this.extensions = cloneRMachineExtensions(extensions);

    const getFormatters = this.extensions.Formatters.get;
    this.fmt = (locale) => {
      this.validateLocaleForPick(locale);
      return getFormatters(locale);
    };
  }

  readonly locales: LocaleList<L>;
  readonly defaultLocale: L;
  readonly localeHelper: LocaleHelper<L>;
  protected readonly config: RMachineConfig<L>;
  protected readonly domainManager: DomainManager;
  protected readonly extensions: RMachineExtensions<FP>;

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

  readonly fmt: FmtGetter<L, ExtractFmt<FP>>;

  static builder<const LL extends AnyLocaleList>(config: RMachineConfigParams<LL>): RMachineBuilder<LL[number]> {
    return {
      with<FPC extends AnyFmtProviderCtor>(
        extensions: PartialRMachineExtensions<FPC>
      ): RMachineExtendedBuilder<LL[number], InstanceType<FPC>> {
        const merged: RMachineExtensions<InstanceType<FPC>> = {
          Formatters: (extensions.Formatters ?? defaultRMachineExtensions.Formatters) as RMachineExtensions<
            InstanceType<FPC>
          >["Formatters"],
        };
        return {
          create<RA extends AnyResourceAtlas>(): RMachine<RA, LL[number], InstanceType<FPC>> {
            return new RMachine(config, merged as RMachineExtensions<InstanceType<FPC>>);
          },
        };
      },
      create<RA extends AnyResourceAtlas>(): RMachine<RA, LL[number], EmptyFmtProvider> {
        return new RMachine(config, defaultRMachineExtensions);
      },
    };
  }
}

export type RMachineLocale<T> =
  T extends RMachineBuilder<infer L> ? L : T extends RMachineExtendedBuilder<infer L, any> ? L : never;

export type RMachineRCtx<T> =
  T extends RMachineExtendedBuilder<infer L, infer FP>
    ? RCtx<L, FP>
    : T extends RMachineBuilder<infer L>
      ? RCtx<L, EmptyFmtProvider>
      : never;
