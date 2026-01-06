"use client";

import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import type { ReactNode } from "react";
import { createContext, use, useCallback, useContext, useMemo } from "react";

type SetLocale = (newLocale: string) => Promise<void>;
type WriteLocale = (newLocale: string) => void | Promise<void>;

export interface ReactBareToolset<A extends AnyAtlas> {
  readonly ReactRMachine: ReactBareRMachine;
  readonly useLocale: () => string;
  // Performance optimization: do not use the same approach as useState ([state, setState])
  // because with required hooks (e.g. useRouter)
  // the setter function should be recreated on every render to capture the latest context.
  readonly useSetLocale: () => SetLocale;
  readonly useR: <N extends AtlasNamespace<A>>(namespace: N) => A[N];
  readonly useRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => RKit<A, NL>;
}

export interface ReactBareRMachine {
  (props: ReactBareRMachineProps): ReactNode;
  probe: (localeOption: string | undefined) => string | undefined;
}
interface ReactBareRMachineProps {
  readonly locale: string;
  readonly writeLocale?: WriteLocale | undefined;
  readonly children: ReactNode;
}

interface ReactBareToolsetContext {
  readonly locale: string;
  readonly writeLocale: WriteLocale | undefined;
}

export async function createReactBareToolset<A extends AnyAtlas>(rMachine: RMachine<A>): Promise<ReactBareToolset<A>> {
  const validateLocale = rMachine.localeHelper.validateLocale;

  const Context = createContext<ReactBareToolsetContext | null>(null);
  Context.displayName = "ReactBareToolsetContext";
  function useReactToolsetContext(): ReactBareToolsetContext {
    const context = useContext(Context);
    if (context === null) {
      throw new RMachineError("ReactBareToolsetContext not found.");
    }

    return context;
  }

  function ReactRMachine({ locale, writeLocale, children }: ReactBareRMachineProps) {
    const value = useMemo<ReactBareToolsetContext>(() => {
      const error = validateLocale(locale);
      if (error) {
        throw new RMachineError(`Unable to render <ReactRMachine> - invalid locale provided "${locale}".`, error);
      }

      return { locale, writeLocale };
    }, [locale, writeLocale]);

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  ReactRMachine.probe = (locale: string | undefined) => {
    if (locale !== undefined && rMachine.localeHelper.validateLocale(locale) !== null) {
      locale = undefined;
    }

    return locale;
  };

  function useLocale(): string {
    return useReactToolsetContext().locale;
  }

  async function setLocale(newLocale: string, context: ReactBareToolsetContext) {
    const { locale, writeLocale } = context;
    if (newLocale === locale) {
      return;
    }

    const error = validateLocale(newLocale);
    if (error) {
      throw error;
    }

    if (writeLocale === undefined) {
      throw new RMachineError("No writeLocale function provided to <ReactRMachine>.");
    }

    const writeLocaleResult = writeLocale(newLocale);
    if (writeLocaleResult instanceof Promise) {
      await writeLocaleResult;
    }
  }

  function useSetLocale(): SetLocale {
    const context = useReactToolsetContext();
    return useCallback<SetLocale>((newLocale: string) => setLocale(newLocale, context), [context]);
  }

  const hybridPickR: (typeof rMachine)["hybridPickR"] = (rMachine as any).hybridPickR;
  function useR<N extends AtlasNamespace<A>>(namespace: N): A[N] {
    const context = useReactToolsetContext();
    const r = hybridPickR(context.locale, namespace);

    return r instanceof Promise ? use(r) : r;
  }

  const hybridPickRKit: (typeof rMachine)["hybridPickRKit"] = (rMachine as any).hybridPickRKit;
  function useRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): RKit<A, NL> {
    const context = useReactToolsetContext();
    const rKit = hybridPickRKit(context.locale, ...namespaces);

    return (rKit instanceof Promise ? use(rKit) : rKit) as RKit<A, NL>;
  }

  return {
    ReactRMachine,
    useLocale,
    useSetLocale,
    useR,
    useRKit,
  };
}
