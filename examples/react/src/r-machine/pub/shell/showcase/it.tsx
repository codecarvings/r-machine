import { localized } from "@/r-machine/setup";

export const r = localized("shell/showcase", {
  appName: "R-Machine × React",
  tagline: "Un tour delle feature — senza router.",

  ui: {
    demoTab: "Demo",
    sourceTab: "Sorgente",
  },

  nav: {
    intro: "Intro",
    outerGear: "OuterGear",
    gearDeps: "Dipendenze tra gear",
    vertex: "Vertex",
    async: "Async + Suspense",
    formatting: "Formattazione",
    localization: "Localizzazione",
    crossLocale: "Cross-locale",
  },

  views: {
    intro: {
      heading: "Il router è un gear",
      blurb:
        "Questa app non ha un router. La view attiva è lo stato di un OuterGear (outer/nav) — cambiare view è solo un'action. Essendo stato client-session, la view selezionata sopravvive perfino a un reload HMR.",
      cardTitle: "Stato di navigazione",
      sidebarNotePre:
        "La sidebar legge e scrive un singolo OuterGear. La view attiva qui sotto è semplicemente lo stato di",
      sidebarNotePost: ":",
      activeViewLabel: "view attiva",
      hmrNote:
        "Modifica una risorsa e salva — grazie all'HMR, l'OuterGear mantiene il suo stato e questa selezione persiste.",
    },
    outerGear: {
      heading: "OuterGear — stato reattivo",
      blurb:
        "Le action mutano lo stato, i getter lo leggono, una cell memoizzata ne deriva un valore e un relay reagisce ai cambiamenti. L'interval vive nel gear con cleanup via Symbol.dispose.",
      oddLabel: "dispari",
      evenLabel: "pari",
      doubledLabel: "raddoppiato (cell memoizzata):",
      note: "Si auto-incrementa ogni secondo tramite un interval gestito dal gear; un relay alterna il badge dispari/pari.",
    },
    gearDeps: {
      heading: "Dipendenze tra gear",
      blurb:
        "operator dipende da timer, dichiarato per token e iniettato completamente tipizzato — niente import, niente wiring manuale. Leggine il valore derivato e comandalo.",
      note: "operator dipende da timer (per token). Il suo getter deriva dal timer e la sua action lo comanda.",
    },
    vertex: {
      heading: "Vertex + VertexFrame",
      blurb:
        "Un vertex gear dà a ogni consumer la propria istanza per default. Avvolgi i consumer in un <VertexFrame> e ne condivideranno una sola.",
      independentTitle: "Indipendenti — senza frame",
      sharedTitle: "Condivisi — dentro un VertexFrame",
      note: "A e B sono istanze indipendenti. C e D condividono una sola istanza tramite il frame — incrementane una e si muovono entrambe.",
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
      note: "Cambia locale (in alto a destra) — raggruppamento dei numeri, valuta e regole dei plurali cambiano di conseguenza.",
    },
    localization: {
      heading: "Localizzazione senza router",
      blurb:
        "Ogni stringa qui viene da uno shell localizzato. Il cambio locale è persistito in localStorage e sopravvive al reload — niente URL, niente router.",
      footnote:
        "Ogni heading, blurb ed etichetta in quest'app è uno shell localizzato — cambiando locale si ri-risolvono tutti.",
    },
    crossLocale: {
      heading: "Un gear, tutte le locale",
      blurb:
        "res.perLocale trasforma uno shell in un LOADER di locale che un gear locale-agnostico chiama a runtime. base/preview chiede al loader lo shell showcase in ogni locale configurata in una volta sola — così questo pannello mostra tutte le traduzioni affiancate, indipendentemente dalla locale attiva dell'app.",
      ambientLabel: "locale dell'app",
      panelNote:
        "Queste card vengono da un solo gear (base/preview) che ha riusato shell/showcase in tutte le locale. Cambia la locale dell'app (in alto a destra) — il badge sopra cambia, ma le card no.",
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
