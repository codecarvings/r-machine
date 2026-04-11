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

import { type AnyResAtlas, type Namespace, namespaceSymbol, type Token } from "#r-machine/core";

type TokenBuilder<RA extends AnyResAtlas> = <N extends Namespace<RA>>(namespace: N) => Token<N>;

export function createTokenBuilder<RA extends AnyResAtlas>(): TokenBuilder<RA> {
  return <N extends Namespace<RA>>(ns: N) => ({ [namespaceSymbol]: ns });
}
