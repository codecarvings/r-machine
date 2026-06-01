import { localized } from "@/r-machine/setup";

export const r = localized("shell/cart", {
  title: "Il tuo carrello",
  itemWord: { one: "articolo", other: "articoli" },
  subtotal: "Subtotale",
  remove: "Rimuovi",
  checkout: "Procedi all'acquisto",
  empty: "Il tuo carrello è vuoto.",
  continueShopping: "Continua lo shopping",
});
