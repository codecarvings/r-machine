import { defineLayout } from "r-machine";
import type { Inner_Catalog } from "./prv/inner/catalog";
import type { Base_StoreConfig } from "./pub/base/store-config";
import type { Outer_Cart } from "./pub/outer/cart";
import type { Shell_Cart } from "./pub/shell/cart/en";
import type { Shell_Catalog } from "./pub/shell/catalog/en";
import type { Shell_Common } from "./pub/shell/common/en";
import type { Shell_Lib_Fmt } from "./pub/shell/lib/fmt";
import type { Shell_Product } from "./pub/shell/product/en";
import type { Vertex_CatalogFilter } from "./pub/vertex/catalog-filter";

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
