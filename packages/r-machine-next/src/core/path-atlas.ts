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
import { type AnyLocale, validateCanonicalUnicodeLocaleId } from "r-machine/locale";
import { ERR_PATH_ATLAS_MALFORMED } from "#r-machine/next/errors";

export type AnySegmentEntryKey = `/${string}`;
type AnyDynamicSegmentEntryKey = `/[${string}]`;
type AnyCatchAllSegmentEntryKey = `/[...${string}]`;
type AnyOptionalCatchAllSegmentEntryKey = `/[[...${string}]]`;

const __error = Symbol("__error");
const __invalidKey = Symbol("__invalidKey");
const __invalidValue = Symbol("__invalidValue");

type SegmentEntry<T, L extends AnyLocale = AnyLocale> =
  T extends TranslatableSegment<T, L> ? T : TranslatableSegment<T, L>;
type DynamicSegmentEntry<T, L extends AnyLocale = AnyLocale> = T extends Segment<T, L> ? T : Segment<T, L>;

type EmptyObject = {
  [key: string]: never;
};

export type Segment<T, L extends AnyLocale = AnyLocale> = {
  [K in keyof T]: K extends "/"
    ? { [__error]: "Invalid empty segment key"; [__invalidKey]: K }
    : K extends AnyCatchAllSegmentEntryKey | AnyOptionalCatchAllSegmentEntryKey
      ? T[K] extends EmptyObject
        ? DynamicSegmentEntry<T[K], L>
        : {
            [__error]: "Catch all segment declarations must be empty objects";
            [__invalidKey]: K;
            [__invalidValue]: T[K];
          }
      : K extends AnyDynamicSegmentEntryKey
        ? T[K] extends object
          ? DynamicSegmentEntry<T[K], L>
          : { [__error]: "Dynamic segment declarations must be objects"; [__invalidKey]: K; [__invalidValue]: T[K] }
        : K extends AnySegmentEntryKey
          ? T[K] extends object
            ? SegmentEntry<T[K], L>
            : { [__error]: "Segment declarations must be objects"; [__invalidKey]: K; [__invalidValue]: T[K] }
          : { [__error]: "Unexpected translation. Object keys must match pattern /${string}"; [__invalidKey]: K };
};

export type TranslatableSegment<T, L extends AnyLocale = AnyLocale> = {
  [K in keyof T]: K extends "/"
    ? { [__error]: "Invalid empty segment key"; [__invalidKey]: K }
    : K extends AnyCatchAllSegmentEntryKey | AnyOptionalCatchAllSegmentEntryKey
      ? T[K] extends EmptyObject
        ? DynamicSegmentEntry<T[K], L>
        : {
            [__error]: "Catch all segment declarations must be empty objects";
            [__invalidKey]: K;
            [__invalidValue]: T[K];
          }
      : K extends AnyDynamicSegmentEntryKey
        ? T[K] extends object
          ? DynamicSegmentEntry<T[K], L>
          : { [__error]: "Dynamic segment declarations must be objects"; [__invalidKey]: K; [__invalidValue]: T[K] }
        : K extends AnySegmentEntryKey
          ? T[K] extends object
            ? SegmentEntry<T[K], L>
            : { [__error]: "Segment declarations must be objects"; [__invalidKey]: K; [__invalidValue]: T[K] }
          : K extends L
            ? T[K] extends AnySegmentEntryKey
              ? T[K]
              : {
                  [__error]: "Segment translations must match pattern /${string}";
                  [__invalidKey]: K;
                  [__invalidValue]: T[K];
                }
            : {
                [__error]: "Unknown locale. Translation key is not in the configured locale set";
                [__invalidKey]: K;
              };
};

// --- Path Atlas ---
export type AnySegment = Record<string, unknown>;

export interface PathAtlas<S extends AnySegment> {
  readonly segment: S;
}
export type AnyPathAtlas = PathAtlas<AnySegment>;

// --- Path Atlas Ctor ---
export interface PathAtlasCtor<PA extends AnyPathAtlas> {
  new (): PA;
}
export type AnyPathAtlasCtor = PathAtlasCtor<AnyPathAtlas>;

// Build and validate PathAtlas
export type BuiltPathAtlas<PA extends AnyPathAtlas> = PA & { containsTranslations: boolean };

export function buildPathAtlas<PA extends AnyPathAtlas>(
  ctor: PathAtlasCtor<PA>,
  allowTranslation: boolean
): BuiltPathAtlas<PA> {
  const instance = new ctor();
  const context: ValidationContext = { foundTranslation: false };
  validateSegment(instance.segment, "", allowTranslation, context);
  return Object.assign(instance, { containsTranslations: context.foundTranslation });
}

interface ValidationContext {
  foundTranslation: boolean;
}

const DYNAMIC_SEGMENT_ENTRY_REGEX = /^\[([^\].]+)\]$/;
const CATCH_ALL_SEGMENT_ENTRY_REGEX = /^\[\.\.\.([^\]]+)\]$/;
const OPTIONAL_CATCH_ALL_SEGMENT_ENTRY_REGEX = /^\[\[\.\.\.([^\]]+)\]\]$/;

function isSegmentEntryKey(key: string): boolean {
  return key.startsWith("/");
}

function isDynamicSegmentEntry(segment: string): boolean {
  return (
    DYNAMIC_SEGMENT_ENTRY_REGEX.test(segment) ||
    CATCH_ALL_SEGMENT_ENTRY_REGEX.test(segment) ||
    OPTIONAL_CATCH_ALL_SEGMENT_ENTRY_REGEX.test(segment)
  );
}

function isCatchAllSegmentEntry(segment: string): boolean {
  return CATCH_ALL_SEGMENT_ENTRY_REGEX.test(segment) || OPTIONAL_CATCH_ALL_SEGMENT_ENTRY_REGEX.test(segment);
}

function validateSegment(
  segment: AnySegment,
  path: string,
  allowTranslation: boolean,
  context: ValidationContext
): void {
  const dynamicChildKeys: string[] = [];

  for (const [key, value] of Object.entries(segment)) {
    if (isSegmentEntryKey(key)) {
      const segment = key.slice(1);
      if (isDynamicSegmentEntry(segment)) {
        dynamicChildKeys.push(key);
      }
      validateSegmentEntry(key, value, path, allowTranslation, context);
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

function validateSegmentEntry(
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

  if (isDynamicSegmentEntry(segment)) {
    const translationKeys = Object.keys(value).filter((k) => !isSegmentEntryKey(k));
    if (translationKeys.length > 0) {
      throw new RMachineConfigError(
        ERR_PATH_ATLAS_MALFORMED,
        `Dynamic segments do not accept translations at path "${currentPath}". Got "${translationKeys.join('", "')}"`
      );
    }
  }

  if (isCatchAllSegmentEntry(segment)) {
    const childSegmentKeys = Object.keys(value).filter(isSegmentEntryKey);
    if (childSegmentKeys.length > 0) {
      throw new RMachineConfigError(
        ERR_PATH_ATLAS_MALFORMED,
        `Catch-all segment declarations must not have child segments at path "${currentPath}"`
      );
    }
  }

  validateSegment(value as AnySegment, currentPath, allowTranslation, context);
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
