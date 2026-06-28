import type { Product } from "@/r-machine/prv/inner/catalog";

/**
 * Catalog data source, passed as a PORT into `inner/catalog`.
 *
 * `inner/catalog` is a server-only resource (inner gears are consumed by
 * `ServerPlug`), so this does NOT need `"use server"` — it runs in-process
 * during the server render. The artificial delay makes the async resolution
 * visible: the server component that reads `inner/catalog` suspends, and the
 * page-level `<Suspense>` shows its skeleton fallback while it resolves.
 *
 * In production this would query a database or a commerce API.
 */
const CATALOG: Product[] = [
  {
    id: "kbd-01",
    name: "Mechanical Keyboard",
    category: "peripherals",
    price: 129.99,
    blurb: "Hot-swappable switches, aluminium frame, per-key RGB.",
  },
  {
    id: "mouse-01",
    name: "Wireless Mouse",
    category: "peripherals",
    price: 79.5,
    blurb: "Ultra-light, 8000 Hz polling, 70-hour battery.",
  },
  {
    id: "mon-01",
    name: "4K Monitor",
    category: "displays",
    price: 1299.0,
    blurb: "27-inch IPS, 4K UHD, factory-calibrated colour.",
  },
  {
    id: "mon-02",
    name: "Ultrawide Display",
    category: "displays",
    price: 899.0,
    blurb: "34-inch curved ultrawide, 144 Hz, HDR600.",
  },
  {
    id: "hp-01",
    name: "Studio Headphones",
    category: "audio",
    price: 249.0,
    blurb: "Closed-back, 40 mm drivers, detachable cable.",
  },
  {
    id: "spk-01",
    name: "Desk Speakers",
    category: "audio",
    price: 159.95,
    blurb: "Active 2.0 bookshelf pair, USB-C + optical in.",
  },
];

export async function fetchProducts(): Promise<Product[]> {
  return CATALOG;
}
