import { CtxManager } from "./ctx-manager.js";
import { type MatchLocalesAlgorithm, matchLocales } from "./locale/locale-matcher.js";
import { LocaleMapperManager } from "./locale-mapper-manager.js";
import type { AnyAtlas, AtlasNamespace } from "./r.js";
import type { AtlasNamespaceList, RKit } from "./r-kit.js";
import {
  type LocaleMapper,
  type RMachineConfig,
  type RMachineConfigFactory,
  validateRMachineConfig,
} from "./r-machine-config.js";

const rMachineInstance: unique symbol = Symbol.for("R-Machine.instance");
interface InternalRMachineConfigFactory extends RMachineConfigFactory {
  [rMachineInstance]: RMachine<AnyAtlas> | undefined;
}

export class RMachine<A extends AnyAtlas> {
  constructor(readonly config: RMachineConfig) {
    const configError = validateRMachineConfig(config);
    if (configError) {
      throw configError;
    }
    this.localeMapperManager = new LocaleMapperManager(config.locales, config.defaultLocale, config.localeMapper);
    this.ctxManager = new CtxManager(config.rResolver);

    this.mapLocale = this.localeMapperManager.map;
  }

  protected localeMapperManager: LocaleMapperManager;
  protected ctxManager: CtxManager;

  readonly matchLocales = (requestedLocales: readonly string[], algorithm?: MatchLocalesAlgorithm): string => {
    return matchLocales(requestedLocales, this.config.locales, this.config.defaultLocale, { algorithm });
  };

  readonly mapLocale: LocaleMapper;

  // Can return a promise or a value
  // This is to make suspense work with react on client
  readonly pickR = <N extends AtlasNamespace<A>>(locale: string, namespace: N): A[N] | Promise<A[N]> => {
    const mappedLocale = this.mapLocale(locale);
    const ctx = this.ctxManager.get(mappedLocale);
    return ctx.pickR(namespace) as A[N] | Promise<A[N]>;
  };

  // Can return a promise or a value
  // This is to make suspense work with react on client
  readonly pickRKit = <NL extends AtlasNamespaceList<A>>(
    locale: string,
    ...namespaces: NL
  ): RKit<A, NL> | Promise<RKit<A, NL>> => {
    const mappedLocale = this.mapLocale(locale);
    const ctx = this.ctxManager.get(mappedLocale);
    return ctx.pickRKit(...namespaces) as RKit<A, NL> | Promise<RKit<A, NL>>;
  };

  // Singleton factory method
  static get<A extends AnyAtlas>(factory: RMachineConfigFactory): RMachine<A> {
    const internalFactory = factory as InternalRMachineConfigFactory;
    const instance = internalFactory[rMachineInstance] as RMachine<A> | undefined;
    if (instance) {
      return instance;
    }

    const config = factory();
    const newInstance = new RMachine<A>(config);
    internalFactory[rMachineInstance] = newInstance as RMachine<AnyAtlas>;
    return newInstance;
  }
}
