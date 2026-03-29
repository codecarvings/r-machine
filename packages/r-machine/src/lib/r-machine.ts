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
import type { AnyFmtProvider, EmptyFmtProvider } from "./fmt.js";
import type { NamespaceList, RKit } from "./r-kit.js";
import { defaultRMachineExtensions, type RMachineExtensions } from "./r-machine-builder.js";
import {
  cloneRMachineConfig,
  type RMachineConfig,
  type RMachineConfigParams,
  validateRMachineConfig,
} from "./r-machine-config.js";
import type { RCtx } from "./r-module.js";
import type { AnyResourceAtlas, AnyResourceAtlasCtor, Namespace } from "./resource-atlas.js";

export class RMachine<RA extends AnyResourceAtlas, L extends AnyLocale, FP extends AnyFmtProvider> {
  constructor(config: RMachineConfig<RA, L>, extensions: RMachineExtensions<FP>) {
    const configError = validateRMachineConfig(config);
    if (configError) {
      throw configError;
    }
    this.config = cloneRMachineConfig(config);
    this.locales = this.config.locales;
    this.defaultLocale = this.config.defaultLocale;
    this.localeHelper = new LocaleHelper(this.config.locales, this.config.defaultLocale);
    this.domainManager = new DomainManager(config.rModuleResolver);
    this.extensions = extensions; // TO BE REMOVED
  }

  readonly locales: LocaleList<L>;
  readonly defaultLocale: L;
  readonly localeHelper: LocaleHelper<L>;
  protected readonly config: RMachineConfig<RA, L>;
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

  static create<RAC extends AnyResourceAtlasCtor, const LL extends AnyLocaleList>(
    config: RMachineConfigParams<RAC, LL>
  ): RMachine<InstanceType<RAC>, LL[number], EmptyFmtProvider> {
    return new RMachine(config as any, defaultRMachineExtensions);
  }
}

export type RMachineLocale<RM extends RMachine<any, any, any>> = RM extends RMachine<any, infer L, any> ? L : never;

export type RMachineRCtx<T> = T extends RMachine<any, infer L, infer FP> ? RCtx<L, FP> : never;

/*
type RBuilder<RA extends AnyResourceAtlas, L extends AnyLocale, FP extends AnyFmtProvider> = (
  $: RCtx<L, FP> & {
    kit: RKit<RA, NamespaceList<RA>>;
  }
) => any;

type RTemp<RA extends AnyResourceAtlas> = {};
*/
