// Imports a module TypeScript cannot resolve to a source file, exercising the
// "imported source missing" continue-branch in the import-graph walk. The
// unresolvable import is intentional — verifyResourceAtlas reads this file via
// the TS Compiler API, where the missing module is the condition under test.
// @ts-expect-error - intentionally unresolvable module for the missing-source test
import "./does-not-exist.js";
export const strategy = {};
