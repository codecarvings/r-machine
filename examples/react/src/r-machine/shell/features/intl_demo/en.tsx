import { type RShape, Shell } from "@/r-machine/setup";

export const r = Shell.define(({ fmt }) => {
  return {
    sectionTitle: "Locale-Aware Formatting",
    sectionSubtitle:
      "Create your own custom formatting functions with the native Intl API and share them across all your resource files.",

    // Pattern 1: template string
    dateTime: {
      label: "Date & Time Formatting",
      badge: "Intl.DateTimeFormat",
      caption: (d: Date) => `Today's date: ${fmt.date.long(d)}`,
    },

    // Pattern 2: formatters embedded in JSX fragments
    number: {
      label: "Number & Currency",
      badge: "Intl.NumberFormat",
      description: (amount: number) => (
        <>
          The value <strong>{fmt.currency(amount)}</strong> is written as <strong>{fmt.number(amount)}</strong> without
          currency.
        </>
      ),
    },

    // Pattern 3: React component declaration
    plural: {
      label: "Plural Rules",
      badge: "Intl.PluralRules",
      Items: ({ count }: { count: number }) => (
        <span>
          You have <strong>{fmt.plural(count, "item", "items")}</strong> in your cart.
        </span>
      ),
    },
  };
});

export type Shell_Features_IntlDemo = RShape<typeof r>;
