import { BasePlug, localized } from "@/r-machine/setup";

export const plug = BasePlug();
export const r = plug.Shell(() => {
  const { fmt } = plug.use();

  return localized("shell/features/intl_demo", {
    sectionTitle: "Formattazione Locale-Aware",
    sectionSubtitle:
      "Crea le tue funzioni di formattazione personalizzate con l'API nativa Intl e condividile tra tutti i tuoi file risorsa.",

    dateTime: {
      label: "Formattazione Date e Orari",
      badge: "Intl.DateTimeFormat",
      caption: (d: Date) => `Data odierna: ${fmt.date.long(d)}`,
    },

    number: {
      label: "Numeri e Valuta",
      badge: "Intl.NumberFormat",
      description: (amount: number) => (
        <>
          Il valore <strong>{fmt.currency(amount)}</strong> si scrive <strong>{fmt.number(amount)}</strong> senza
          valuta.
        </>
      ),
    },

    plural: {
      label: "Regole di Pluralizzazione",
      badge: "Intl.PluralRules",
      Items: ({ count }: { count: number }) => (
        <span>
          Hai <strong>{fmt.plural(count, "elemento", "elementi")}</strong> nel carrello.
        </span>
      ),
    },
  });
});
