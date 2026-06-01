import { defineLayout } from "r-machine";
import type { Base_StoreConfig } from "./base/store-config";
import type { Inner_Catalog } from "./inner/catalog";
import type { Outer_Cart } from "./outer/cart";
import type { Shell_Cart } from "./shell/cart/en";
import type { Shell_Catalog } from "./shell/catalog/en";
import type { Shell_Common } from "./shell/common/en";
import type { Shell_Lib_Fmt } from "./shell/lib/fmt";
import type { Shell_Product } from "./shell/product/en";
import type { Vertex_CatalogFilter } from "./vertex/catalog-filter";

const folders = defineLayout({
  "inner/": "gear:inner",
  "base/": "gear:base",
  "outer/": "gear:outer",
  "vertex/": "gear:outer(vertex)",
  "shell/": "shell",
  "shell/lib/": "shell(mono)",
});

type ResourceMap = {
  "inner/catalog": Inner_Catalog;
  "base/store-config": Base_StoreConfig;
  "outer/cart": Outer_Cart;
  "vertex/catalog-filter": Vertex_CatalogFilter;

  "shell/common": Shell_Common;
  "shell/catalog": Shell_Catalog;
  "shell/product": Shell_Product;
  "shell/cart": Shell_Cart;
  "shell/lib/fmt": Shell_Lib_Fmt;
};

export class ResourceAtlas extends folders<ResourceMap>() {}
const token = ResourceAtlas.getTokenBuilder();

export const fmt = token("shell/lib/fmt");
