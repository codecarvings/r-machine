import { localized } from "@/r-machine/setup";

export const r = localized("shell/landing-page", {
  hero: {
    title: "Routing del Locale con R-Machine",
    // Tagline per-strategia: dice dove vive il locale in questa strategia.
    subtitle: "Il locale vive in un cookie — l'URL resta lo stesso.",
    cta: {
      secondary: "GitHub Repository",
    },
  },
  timer: {
    title: "Stato del gear client",
    note: "L'interval vive in un OuterGear, non nel componente. Il suo stato sopravvive al cambio di locale.",
    unit: { one: "secondo", other: "secondi" },
  },
  playground: {
    title: "Prova il routing",
    subtitle: "Segui i link e osserva come cambia l'URL per il locale corrente.",
  },
});
