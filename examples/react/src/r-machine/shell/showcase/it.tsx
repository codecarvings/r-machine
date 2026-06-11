import { localized } from "@/r-machine/setup";

export const r = localized("shell/showcase", {
  appName: "R-Machine × React",
  tagline: "Un tour delle feature — senza router.",

  nav: {
    intro: "Intro",
    "outer-gear": "OuterGear",
    "gear-deps": "Dipendenze tra gear",
    vertex: "Vertex",
    async: "Async + Suspense",
    formatting: "Formattazione",
    localization: "Localizzazione",
  },

  views: {
    intro: {
      heading: "Il router è un gear",
      blurb:
        "Questa app non ha un router. La view attiva è lo stato di un OuterGear (outer/nav) — cambiare view è solo un'action. Essendo stato client-session, la view selezionata sopravvive perfino a un reload HMR.",
    },
    "outer-gear": {
      heading: "OuterGear — stato reattivo",
      blurb:
        "Le action mutano lo stato, i getter lo leggono, una cell memoizzata ne deriva un valore e un relay reagisce ai cambiamenti. L'interval vive nel gear con cleanup via Symbol.dispose.",
    },
    "gear-deps": {
      heading: "Dipendenze tra gear",
      blurb:
        "operator dipende da timer, dichiarato per token e iniettato completamente tipizzato — niente import, niente wiring manuale. Leggine il valore derivato e comandalo.",
    },
    vertex: {
      heading: "Vertex + VertexFrame",
      blurb:
        "Un vertex gear dà a ogni consumer la propria istanza per default. Avvolgi i consumer in un <VertexFrame> e ne condivideranno una sola.",
    },
    async: {
      heading: "Shell async + Suspense",
      blurb:
        "Uno shell può essere async. Il consumer si sospende finché non si risolve; DelayedSuspense mostra un fallback solo se l'attesa è abbastanza lunga.",
    },
    formatting: {
      heading: "Formattazione locale-aware",
      blurb:
        "Un mono shell avvolge le API native Intl. Numeri, valuta, date e plurali si riformattano da soli quando cambi locale.",
    },
    localization: {
      heading: "Localizzazione senza router",
      blurb:
        "Ogni stringa qui viene da uno shell localizzato. Il cambio locale è persistito in localStorage e sopravvive al reload — niente URL, niente router.",
    },
  },

  formatting: {
    dateLabel: "Data",
    numberLabel: "Numero",
    currencyLabel: "Valuta",
    pluralLabel: "Plurale",
    countLabel: "Elementi",
    unit: { one: "elemento", other: "elementi" },
  },

  localization: {
    currentLocaleLabel: "Locale corrente",
    note: "Scegli una lingua dallo switcher in alto a destra. La scelta è salvata in localStorage e riapplicata al reload.",
  },
});
