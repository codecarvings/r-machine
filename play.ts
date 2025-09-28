import { createConfig, typeRef } from "r-machine";

type Atlas = {
  ns1: { message: string };
};

const config = createConfig(typeRef<Atlas>(), {
  locales: ["en", "it"],
  defaultLocale: "en",
  loader: async (namespace, locale) => {
    return { message: `${namespace} in ${locale}` };
  },
});

console.log(config);
