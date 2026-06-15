// Part of an import cycle (a → b → a) with no ResourceAtlas anywhere, to drive
// the `visited` revisit guard in the import-graph walk.
import "./cyclic-b.js";
export const a = 1;
