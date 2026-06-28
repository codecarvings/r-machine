// Fixture: a server-side resource module (stand-in for an OuterGear) that
// transitively pulls in a `"use client"` module — mirroring
// outer → server-action → server-toolset → client-toolset → next/navigation.
import ClientDefault, { ClientThing } from "./client-comp.js";

export const marker = "outer-loaded";
// After the boundary stub: `default` is a no-op callable, named exports are
// undefined (jiti builds the namespace from enumerable own keys).
export const clientDefault = ClientDefault;
export const clientNamed = ClientThing;
