import { localized, Shell } from "@/r-machine/setup";

export const r = Shell.define(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return localized("shell/async-demo", {
    badge: "Risolto",
    title: "Caricato in modo asincrono",
    body: "Questo shell ha atteso 1,5s prima di risolversi — il consumer si è sospeso e un fallback è stato mostrato finché il dato non è arrivato.",
  });
});
