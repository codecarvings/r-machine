import type { AnyFmtProvider, AnyResourceAtlas, EmptyFmtProvider, Namespace, NamespaceList } from "#r-machine";
import type { AnyLocale } from "#r-machine/locale";
import { RMachine } from "../../src/lib/r-machine.js";

export class TestableRMachine<
  RA extends AnyResourceAtlas,
  L extends AnyLocale = string,
  FP extends AnyFmtProvider = EmptyFmtProvider,
> extends RMachine<RA, L, FP> {
  public exposeHybridPickR<N extends Namespace<RA>>(locale: L, namespace: N): RA[N] | Promise<RA[N]> {
    return this.hybridPickR(locale, namespace);
  }
  public exposeHybridPickRKit<NL extends NamespaceList<RA>>(locale: L, ...namespaces: NL) {
    return this.hybridPickRKit(locale, ...namespaces);
  }
}
