import type { R } from "r-machine";
import type { R$ } from "@/r-machine/r-machine";

/*
 * If you prefer, you can also import the formatters directly in your resource files and use
 * them as regular functions, without the need to access them through the R$ parameter.
 * This is useful if you don't want to use a factory function for your resources and prefer
 * to export a plain object instead.
 */
// const { date, number, currency, plural } = Formatters.get("en");

const r = ($: R$) => {
  const { date, number, currency, plural } = $.fmt;

  return {
    sectionTitle: "Locale-Aware Formatting",
    sectionSubtitle:
      "Create your own custom formatting functions with the native Intl API and share them across all your resource files.",

    // Pattern 1: template string
    dateTime: {
      label: "Date & Time Formatting",
      badge: "Intl.DateTimeFormat",
      caption: (d: Date) => `Today's date: ${date.long(d)}`,
    },

    // Pattern 2: formatters embedded in JSX fragments
    number: {
      label: "Number & Currency",
      badge: "Intl.NumberFormat",
      description: (amount: number) => (
        <>
          The value <strong>{currency(amount)}</strong> is written as <strong>{number(amount)}</strong> without
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
          You have <strong>{plural(count, "item", "items")}</strong> in your cart.
        </span>
      ),
    },
  };
};

export default r;
export type R_Features_IntlDemo = R<typeof r>;
