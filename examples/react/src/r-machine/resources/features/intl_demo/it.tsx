import type { R$ } from "@/r-machine/r-machine";
import type { R_Features_IntlDemo } from "./en";

/*
 * If you prefer, you can also import the formatters directly in your resource files and use
 * them as regular functions, without the need to access them through the R$ parameter.
 * This is useful if you don't want to use a factory function for your resources and prefer
 * to export a plain object instead.
 */
// const { date, time, number, currency, plural } = Formatters.get("it");

const r = ($: R$): R_Features_IntlDemo => {
  const { date, time, number, currency, plural } = $.fmt;

  return {
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
};

export default r;
