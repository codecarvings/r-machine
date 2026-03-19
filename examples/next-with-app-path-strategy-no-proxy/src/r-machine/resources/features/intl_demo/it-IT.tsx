import { fmt } from "@/r-machine/formatters";
import type { R_Features_IntlDemo } from "./en";

const { date, time, number, currency, plural } = fmt("it-IT");

const r: R_Features_IntlDemo = {
  sectionTitle: "Formattazione Locale-Aware",
  sectionSubtitle:
    "Crea le tue funzioni di formattazione personalizzate con l'API nativa Intl e condividile tra tutti i tuoi file risorsa.",

  dateTime: {
    label: "Formattazione Date e Orari",
    badge: "Intl.DateTimeFormat",
    time: time,
    caption: (d: Date) => `Data odierna: ${date.long(d)}`,
  },

  number: {
    label: "Numeri e Valuta",
    badge: "Intl.NumberFormat",
    description: (amount: number) => (
      <>
        Il valore <strong>{currency(amount)}</strong> si scrive <strong>{number(amount)}</strong> senza valuta.
      </>
    ),
  },

  plural: {
    label: "Regole di Pluralizzazione",
    badge: "Intl.PluralRules",
    Items: ({ count }: { count: number }) => (
      <span>
        Hai <strong>{plural(count, "elemento", "elementi")}</strong> nel carrello.
      </span>
    ),
  },
};

export default r;
