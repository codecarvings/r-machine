/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/next, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import Cookies from "js-cookie";
import type { AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyLocale } from "r-machine/locale";
import type { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { setCookie } from "#r-machine/next/internal";
import type { NextAppClientImpl } from "../next-app-client-toolset.js";
import type { AnyNextAppFlatStrategyConfig } from "./next-app-flat-strategy-core.js";

export async function createNextAppFlatClientImpl<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  C extends AnyNextAppFlatStrategyConfig,
>(_rMachine: RMachine<RA, L>, strategyConfig: C, pathTranslator: HrefTranslator, pathCanonicalizer: HrefCanonicalizer) {
  const { cookie } = strategyConfig;
  const { name: cookieName, ...cookieConfig } = cookie;

  return {
    onLoad(locale) {
      const cookieLocale = Cookies.get(cookieName);
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

    createUsePathComposer: (useLocale) => {
      return () => {
        const locale = useLocale();

        return (path, params) => pathTranslator.get(locale, path, params).value;
      };
    },
  } as NextAppClientImpl<L>;
}
