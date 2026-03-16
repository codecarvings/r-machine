import type { AnyLocale, AnyResourceAtlas, Namespace, NamespaceList, RMachineConfig } from "#r-machine";
import { RMachine } from "../../src/lib/r-machine.js";

export class TestableRMachine<RA extends AnyResourceAtlas, L extends AnyLocale = string> extends RMachine<RA, L> {
  constructor(config: RMachineConfig<L>) {
    super(config);
  }
  public exposeHybridPickR<N extends Namespace<RA>>(locale: L, namespace: N): RA[N] | Promise<RA[N]> {
    return this.hybridPickR(locale, namespace);
  }
  public exposeHybridPickRKit<NL extends NamespaceList<RA>>(locale: L, ...namespaces: NL) {
    return this.hybridPickRKit(locale, ...namespaces);
  }
}
