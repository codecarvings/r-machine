import type { R, R$ } from "r-machine";

const rFactory = ($: R$) => {
  const format = new Intl.DateTimeFormat($.locale, {
    dateStyle: "full",
    timeStyle: "long",
  });

  return {
    title: "R-Machine example with React",
    welcomeMessage: ({ date }: { date: Date }) => `Welcome to R-Machine with React! - ${format.format(date)}`,
    currentLanguage: `Current language is: (${$.locale}) - NS: ${$.namespace}`,
  };
};

export default rFactory;
export type R_Common = R<typeof rFactory>;
