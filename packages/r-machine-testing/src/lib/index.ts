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

export { disposeResources } from "./dispose-resources.js";
export { createEventCollector, type EventCollector } from "./event-collector.js";
export { mockPlug } from "./mock-plug.js";
export {
  type SourceLocation,
  type VerifyIssue,
  type VerifyReport,
  type VerifyResourceAtlasOptions,
  verifyResourceAtlas,
} from "./verify-resource-atlas.js";
