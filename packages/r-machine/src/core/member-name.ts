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

import { type AnyAction, isAction } from "./action.js";
import { type AnyGetter, isGetter } from "./getter.js";
import { type AnyRelay, isRelay } from "./relay.js";

const memberNameSymbol: unique symbol = Symbol("memberName");

/** @internal — attaches the (mutable) name slot on a getter/action/relay. */
export function setMemberName(target: object, name: string): void {
  Object.defineProperty(target, memberNameSymbol, { value: name, writable: true, configurable: true });
}

type NamedMember = AnyGetter | AnyAction | AnyRelay;

/** Reads the name attached to a getter/action/relay by the OuterGear cursor. */
export function getMemberName(member: NamedMember): string {
  return (member as unknown as { [memberNameSymbol]: string })[memberNameSymbol];
}

/**
 * Top-level walk over the resource object: for each entry whose value is a
 * Getter / Action / Relay, overwrite the member's auto-generated `kind:N`
 * name with the property name under which it is exported. Last occurrence
 * wins (insertion order) — an action ref exported under multiple keys takes
 * the last key's name.
 *
 * @internal — exposed for testing the naming wiring.
 */
export function promoteMemberNames(resource: unknown): void {
  if (resource == null || typeof resource !== "object") {
    return;
  }

  for (const [key, value] of Object.entries(resource)) {
    if (isGetter(value) || isAction(value) || isRelay(value)) {
      setMemberName(value as object, key);
    }
  }
}
