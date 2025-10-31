import type { R_Features_Box_1_2 } from "./en";

const r: R_Features_Box_1_2 = {
  box1: {
    title: "Traduzioni Type-Safe",
    description: (
      <>
        <span className="font-semibold">
          Supporto completo TypeScript con auto-completamento e validazione in fase di compilazione.
        </span>
        traduzioni mancanti prima che raggiungano la produzione.
      </>
    ),
    badge: "TypeScript",
  },
  box2: {
    title: "Minimo Costo Runtime",
    description: (
      <>
        <span className="font-semibold">
          Accesso alle traduzioni come semplici proprietà di oggetto senza parsing delle stringhe.
        </span>
        Carica solo i namespace necessari.
      </>
    ),
    badge: "Performance",
  },
};

export default r;
