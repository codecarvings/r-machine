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
import { defaultCookieDeclaration } from "r-machine/strategy/web";
import type { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { setCookie } from "#r-machine/next/internal";
import type { NextAppClientImpl } from "../next-app-client-toolset.js";
import type { AnyNextAppPathStrategyConfig } from "./next-app-path-strategy-core.js";

// const pathComposerNormalizerRegExp = /^\//;

export async function createNextAppPathClientImpl<RA extends AnyResourceAtlas, L extends AnyLocale>(
  _rMachine: RMachine<RA, L>,
  strategyConfig: AnyNextAppPathStrategyConfig,
  pathTranslator: HrefTranslator,
  pathCanonicalizer: HrefCanonicalizer
) {
  const { cookie } = strategyConfig;
  const cookieSw = cookie !== "off";
  const { name: cookieName, ...cookieConfig } = cookieSw ? (cookie === "on" ? defaultCookieDeclaration : cookie) : {};

  let onLoad: NextAppClientImpl<L>["onLoad"];
  if (cookieSw) {
    onLoad = (locale) => {
      const cookieLocale = Cookies.get(cookieName!);
      if (locale !== cookieLocale) {
        // 1) Set cookie on load (required when not using the proxy)
        setCookie(cookieName!, locale, cookieConfig);
      }
    };
  }

  return {
    onLoad,

    writeLocale(locale, newLocale, pathname, router) {
      if (newLocale === locale) {
        return;
      }

      const contentPath = pathCanonicalizer.get(locale, pathname);
      let newPath: string;
      if (contentPath.dynamic) {
        // If dynamic, translation of slugs is not available, redirect to root
        newPath = pathTranslator.get(newLocale, "/").value;
      } else {
        // Static path, surely no params
        newPath = pathTranslator.get(newLocale, contentPath.value).value;
      }

      if (cookieSw) {
        // 2) Set cookie on write (required when implicitDefaultLocale is on - problem with double redirect on explicit path)
        setCookie(cookieName!, newLocale, cookieConfig);
      }
      router.push(newPath);
    },

    createUsePathComposer: (useLocale) => {
      return () => {
        const locale = useLocale();

        return (path, params) => pathTranslator.get(locale, path, params).value;
      };
    },
  } as NextAppClientImpl<L>;
}
