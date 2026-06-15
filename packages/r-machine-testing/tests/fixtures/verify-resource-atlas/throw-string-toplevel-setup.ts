import "./resource-atlas.js"; // keep ResourceAtlas reachable so static phase succeeds

// Throws a non-Error during the RUNTIME import (config-access phase), exercising
// `errorMessage`'s `String(err)` fallback for a thrown value that is not an Error.
throw "non-error top-level failure";
