import type { AnyPathAtlas } from "../../../src/core/path-atlas.js";

export function createMockAtlas(decl: object = {}): AnyPathAtlas {
  return { decl };
}

export const aboutAtlas = createMockAtlas({
  "/about": {
    it: "/chi-siamo",
  },
});

export const aboutWithTeamAtlas = createMockAtlas({
  "/about": {
    it: "/chi-siamo",
    "/team": {
      it: "/staff",
    },
  },
});

export const productsAtlas = createMockAtlas({
  "/products": {
    it: "/prodotti",
    "/[id]": {},
  },
});

export const docsWithCatchAllAtlas = createMockAtlas({
  "/docs": {
    it: "/documenti",
    "/[...slug]": {},
  },
});

export const docsWithOptionalCatchAllAtlas = createMockAtlas({
  "/docs": {
    it: "/documenti",
    "/[[...slug]]": {},
  },
});
