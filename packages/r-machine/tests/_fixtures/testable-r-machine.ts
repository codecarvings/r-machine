import type { AnyResourceAtlas, Namespace, NamespaceList } from "#r-machine";
import type { AnyLocale } from "#r-machine/locale";
import { RMachine } from "../../src/lib/r-machine.js";
import type { NamespaceMap } from "../../src/lib/r-map.js";

export class TestableRMachine<
  RA extends AnyResourceAtlas,
  L extends AnyLocale = string,
  KA extends NamespaceMap<RA> = {},
> extends RMachine<RA, L, KA> {
  public exposeHybridPickR<N extends Namespace<RA>>(locale: L, namespace: N): RA[N] | Promise<RA[N]> {
    return this.hybridPickR(locale, namespace);
  }
  public exposeHybridPickRKit<NL extends NamespaceList<RA>>(locale: L, ...namespaces: NL) {
    return this.hybridPickRKit(locale, ...namespaces);
  }
}
