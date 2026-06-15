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

export type { EventCollector } from "./event-collector.js";
export { createEventCollector } from "./event-collector.js";
export type { MockListController, MockMapController } from "./mock-controller.js";
export { mockPlug, resetMockPlugs } from "./mock-plug.js";
export type { VerifyIssue, VerifyReport, VerifyResourceAtlasOptions } from "./verify-resource-atlas.js";
export { verifyResourceAtlas } from "./verify-resource-atlas.js";
