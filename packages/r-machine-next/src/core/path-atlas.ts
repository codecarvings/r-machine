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

import { RMachineConfigError } from "r-machine/errors";
import { validateCanonicalUnicodeLocaleId } from "r-machine/locale";
import { ERR_PATH_ATLAS_MALFORMED } from "#r-machine/next/errors";

export type AnySegmentKey = `/${string}`;
type AnyDynamicSegmentKey = `/[${string}]`;
type AnyCatchAllSegmentKey = `/[...${string}]`;
type AnyOptionalCatchAllSegmentKey = `/[[...${string}]]`;

const __error = Symbol("__error");
const __invalidKey = Symbol("__invalidKey");
const __invalidValue = Symbol("__invalidValue");

type Segment<T> = T extends TranslatableSegmentDecl<T> ? T : TranslatableSegmentDecl<T>;
type DynamicSegment<T> = T extends NonTranslatableSegmentDecl<T> ? T : NonTranslatableSegmentDecl<T>;

type EmptyObject = {
  [key: string]: never;
};

export type NonTranslatableSegmentDecl<T> = {
  [K in keyof T]: K extends "/"
    ? { [__error]: "Invalid empty segment key"; [__invalidKey]: K }
    : K extends AnyCatchAllSegmentKey | AnyOptionalCatchAllSegmentKey
      ? T[K] extends EmptyObject
        ? DynamicSegment<T[K]>
        : {
            [__error]: "Catch all segment declarations must be empty objects";
            [__invalidKey]: K;
            [__invalidValue]: T[K];
          }
      : K extends AnyDynamicSegmentKey
        ? T[K] extends object
          ? DynamicSegment<T[K]>
          : { [__error]: "Dynamic segment declarations must be objects"; [__invalidKey]: K; [__invalidValue]: T[K] }
        : K extends AnySegmentKey
          ? T[K] extends object
            ? Segment<T[K]>
            : { [__error]: "Segment declarations must be objects"; [__invalidKey]: K; [__invalidValue]: T[K] }
          : { [__error]: "Unexpected translation. Object keys must match pattern /${string}"; [__invalidKey]: K };
};

export type TranslatableSegmentDecl<T> = {
  [K in keyof T]: K extends "/"
    ? { [__error]: "Invalid empty segment key"; [__invalidKey]: K }
    : K extends AnyCatchAllSegmentKey | AnyOptionalCatchAllSegmentKey
      ? T[K] extends EmptyObject
        ? DynamicSegment<T[K]>
        : {
            [__error]: "Catch all segment declarations must be empty objects";
            [__invalidKey]: K;
            [__invalidValue]: T[K];
          }
      : K extends AnyDynamicSegmentKey
        ? T[K] extends object
          ? DynamicSegment<T[K]>
          : { [__error]: "Dynamic segment declarations must be objects"; [__invalidKey]: K; [__invalidValue]: T[K] }
        : K extends AnySegmentKey
          ? T[K] extends object
            ? Segment<T[K]>
            : { [__error]: "Segment declarations must be objects"; [__invalidKey]: K; [__invalidValue]: T[K] }
          : T[K] extends AnySegmentKey
            ? T[K]
            : {
                [__error]: "Segment translations must match pattern /${string}";
                [__invalidKey]: K;
                [__invalidValue]: T[K];
              };
};

export interface AnyPathAtlas {
  readonly decl: object;
}
export type PathAtlasCtor<PA extends AnyPathAtlas> = new () => PA;

export type ExtendedPathAtlas<PA extends AnyPathAtlas> = PA & { containsTranslations: boolean };

// Build and validate PathAtlas
export function buildPathAtlas<PA extends AnyPathAtlas>(
  ctor: PathAtlasCtor<PA>,
  allowTranslation: boolean
): ExtendedPathAtlas<PA> {
  const instance = new ctor();
  const context: ValidationContext = { foundTranslation: false };
  validatePathAtlasDecl(instance.decl, "", allowTranslation, context);
  return Object.assign(instance, { containsTranslations: context.foundTranslation });
}

interface ValidationContext {
  foundTranslation: boolean;
}

const DYNAMIC_SEGMENT_REGEX = /^\[([^\].]+)\]$/;
const CATCH_ALL_SEGMENT_REGEX = /^\[\.\.\.([^\]]+)\]$/;
const OPTIONAL_CATCH_ALL_SEGMENT_REGEX = /^\[\[\.\.\.([^\]]+)\]\]$/;

function isSegmentKey(key: string): boolean {
  return key.startsWith("/");
}

function isDynamicSegment(segment: string): boolean {
  return (
    DYNAMIC_SEGMENT_REGEX.test(segment) ||
    CATCH_ALL_SEGMENT_REGEX.test(segment) ||
    OPTIONAL_CATCH_ALL_SEGMENT_REGEX.test(segment)
  );
}

function isCatchAllSegment(segment: string): boolean {
  return CATCH_ALL_SEGMENT_REGEX.test(segment) || OPTIONAL_CATCH_ALL_SEGMENT_REGEX.test(segment);
}

function validatePathAtlasDecl(
  decl: object,
  path: string,
  allowTranslation: boolean,
  context: ValidationContext
): void {
  const dynamicChildKeys: string[] = [];

  for (const [key, value] of Object.entries(decl)) {
    if (isSegmentKey(key)) {
      const segment = key.slice(1);
      if (isDynamicSegment(segment)) {
        dynamicChildKeys.push(key);
      }
      validateSegmentDecl(key, value, path, allowTranslation, context);
    } else {
      validateTranslation(key, value, path, allowTranslation, context);
    }
  }

  if (dynamicChildKeys.length > 1) {
    throw new RMachineConfigError(
      ERR_PATH_ATLAS_MALFORMED,
      `Segment at path "${path || "/"}" has multiple dynamic children: ${dynamicChildKeys.join(", ")}. Only one dynamic segment is allowed per level.`
    );
  }
}

function validateSegmentDecl(
  key: string,
  value: unknown,
  parentPath: string,
  allowTranslation: boolean,
  context: ValidationContext
): void {
  const currentPath = `${parentPath}${key}`;

  if (key === "/") {
    throw new RMachineConfigError(ERR_PATH_ATLAS_MALFORMED, `Invalid empty segment key at path "${parentPath || "/"}"`);
  }

  if (key.indexOf("/", 1) !== -1) {
    throw new RMachineConfigError(
      ERR_PATH_ATLAS_MALFORMED,
      `Segment key must contain only one "/" at the beginning at path "${parentPath || "/"}". Got "${key}"`
    );
  }

  if (typeof value !== "object" || value === null) {
    throw new RMachineConfigError(
      ERR_PATH_ATLAS_MALFORMED,
      `Segment declarations must be objects at path "${currentPath}"`
    );
  }

  const segment = key.slice(1);

  if (isDynamicSegment(segment)) {
    const translationKeys = Object.keys(value).filter((k) => !isSegmentKey(k));
    if (translationKeys.length > 0) {
      throw new RMachineConfigError(
        ERR_PATH_ATLAS_MALFORMED,
        `Dynamic segments do not accept translations at path "${currentPath}". Got "${translationKeys.join('", "')}"`
      );
    }
  }

  if (isCatchAllSegment(segment)) {
    const childSegmentKeys = Object.keys(value).filter(isSegmentKey);
    if (childSegmentKeys.length > 0) {
      throw new RMachineConfigError(
        ERR_PATH_ATLAS_MALFORMED,
        `Catch-all segment declarations must not have child segments at path "${currentPath}"`
      );
    }
  }

  validatePathAtlasDecl(value as object, currentPath, allowTranslation, context);
}

function validateTranslation(
  key: string,
  value: unknown,
  path: string,
  allowTranslation: boolean,
  context: ValidationContext
): void {
  if (!allowTranslation) {
    throw new RMachineConfigError(
      ERR_PATH_ATLAS_MALFORMED,
      `Path translations are not supported by this strategy. Found translation "${key}" at path "${path}"`
    );
  }

  if (path === "") {
    throw new RMachineConfigError(
      ERR_PATH_ATLAS_MALFORMED,
      `Root level segment does not accept translations. Got "${key}"`
    );
  }

  const localeError = validateCanonicalUnicodeLocaleId(key);
  if (localeError !== null) {
    throw new RMachineConfigError(
      ERR_PATH_ATLAS_MALFORMED,
      `Invalid translation key "${key}" at path "${path}". ${localeError.message}`
    );
  }

  if (typeof value !== "string") {
    throw new RMachineConfigError(
      ERR_PATH_ATLAS_MALFORMED,
      `Segment translation "${key}" must be a string at path "${path}". Got ${typeof value}`
    );
  }

  if (!value.startsWith("/")) {
    throw new RMachineConfigError(
      ERR_PATH_ATLAS_MALFORMED,
      `Segment translation "${key}" must match pattern /\${string} at path "${path}". Got "${value}"`
    );
  }

  if (value.indexOf("/", 1) !== -1) {
    throw new RMachineConfigError(
      ERR_PATH_ATLAS_MALFORMED,
      `Segment translation "${key}" must contain only one "/" at the beginning at path "${path}". Got "${value}"`
    );
  }

  context.foundTranslation = true;
}
