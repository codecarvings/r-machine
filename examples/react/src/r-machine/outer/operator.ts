import { OuterGear, type RShape } from "../setup";

// A gear that depends on another gear. The dependency is declared by token
// (`outer/timer`) and injected fully typed — no imports, no wiring.
export const r = OuterGear.withDeps("outer/timer").define((plugin, _) => {
  const [timer] = plugin;

  return {
    negative: _.getter(() => -timer.value),
    add10: () => timer.add(10),
  };
});

export type Outer_Operator = RShape<typeof r>;
