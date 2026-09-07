/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

import type { RMachine } from "r-machine";
import type { AnyResAtlas, AnyResEquipment, ExperimentalFlags } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import { getCookie, setCookie } from "r-machine/strategy/web";
import type { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import type { NextAppClientImpl } from "#r-machine/next/core/app";
import type { AnyNextAppFlatStrategyConfig } from "./next-app-flat-strategy-core.js";

export async function createNextAppFlatClientImpl<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
  C extends AnyNextAppFlatStrategyConfig,
>(
  _rMachine: RMachine<RA, L, E, EF>,
  strategyConfig: C,
  pathTranslator: HrefTranslator,
  pathCanonicalizer: HrefCanonicalizer
) {
  const { cookie } = strategyConfig;
  const { name: cookieName, ...cookieConfig } = cookie;

  return {
    onLoad(locale) {
      const cookieLocale = getCookie(cookieName);
      if (locale !== cookieLocale) {
        setCookie(cookieName, locale, cookieConfig);
      }
    },

    writeLocale(locale, newLocale, pathname, router) {
      if (newLocale === locale) {
        return;
      }

      const canonicalPath = pathCanonicalizer.get(locale, pathname);
      let path: string;
      if (canonicalPath.dynamic) {
        // If dynamic, translation of slugs is not available, redirect to root
        path = pathTranslator.get(newLocale, "/").value;
      } else {
        // Static path, surely no params
        path = pathTranslator.get(newLocale, canonicalPath.value).value;
      }

      setCookie(cookieName, newLocale, cookieConfig);
      if (path !== pathname) {
        router.push(path);
      }
      // Necessary to reload data
      router.refresh();
    },

    createPathComposer: (locale) => (path, params) => pathTranslator.get(locale, path, params).value,
  } as NextAppClientImpl<L>;
}
