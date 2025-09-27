import { createConfig, typeOf } from "r-machine";

type Resources = {
  common: { message: string };
};

const config = createConfig(typeOf<Resources>(), {
  locales: ["en", "it"],
  defaultLocale: "en",
  loader: async (namespace, locale) => {
    return { message: `${namespace} in ${locale}` };
  },
});

console.log(config);
