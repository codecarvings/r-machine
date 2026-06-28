import { localized } from "@/r-machine/setup";

export const r = localized("shell/catalog", {
  heading: "Esplora il negozio",
  subtitle: "Un catalogo finto che mostra ogni primitivo di R-Machine.",
  sort: {
    label: "Ordina per",
    priceAsc: "Prezzo: crescente",
    priceDesc: "Prezzo: decrescente",
    name: "Nome",
  },
  category: {
    all: "Tutti i prodotti",
    peripherals: "Periferiche",
    displays: "Monitor",
    audio: "Audio",
  },
  viewDetails: "Vedi dettagli",
});
