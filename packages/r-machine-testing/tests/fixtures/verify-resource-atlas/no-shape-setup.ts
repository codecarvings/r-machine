import { ResourceAtlas } from "./no-shape-atlas.js";

// Extraction fails in the STATIC phase (no `shape`), so the runtime strategy is
// never consulted — a bare object is enough.
export const strategy = { ResourceAtlas };
