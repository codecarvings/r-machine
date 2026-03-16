"use client";

import type { AnyLocale, AnyResourceAtlas, Namespace, NamespaceList, RKit, RMachine } from "r-machine";
import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "r-machine/errors";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo } from "react";
import { ERR_CONTEXT_NOT_FOUND, ERR_MISSING_WRITE_LOCALE } from "#r-machine/react/errors";

type SetLocale<L extends AnyLocale> = (newLocale: L) => Promise<void>;
type WriteLocale<L extends AnyLocale> = (newLocale: L) => void | Promise<void>;

export interface ReactBareToolset<RA extends AnyResourceAtlas, L extends AnyLocale> {
  readonly ReactRMachine: ReactBareRMachine<L>;
  readonly useLocale: () => L;
  // Performance optimization: do not use the same approach as useState ([state, setState])
  // because with required hooks (e.g. useRouter)
  // the setter function should be recreated on every render to capture the latest context.
  readonly useSetLocale: () => SetLocale<L>;
  readonly useR: <N extends Namespace<RA>>(namespace: N) => RA[N];
  readonly useRKit: <NL extends NamespaceList<RA>>(...namespaces: NL) => RKit<RA, NL>;
}

export interface ReactBareRMachine<L extends AnyLocale> {
  (props: ReactBareRMachineProps<L>): ReactNode;
  probe: (localeOption: string | undefined) => L | undefined;
}
interface ReactBareRMachineProps<L extends AnyLocale> {
  readonly locale: L;
  readonly writeLocale?: WriteLocale<L> | undefined;
  readonly children: ReactNode;
}

interface ReactBareToolsetContext<L extends AnyLocale> {
  readonly locale: L;
  readonly writeLocale: WriteLocale<L> | undefined;
}

export async function createReactBareToolset<RA extends AnyResourceAtlas, L extends AnyLocale>(
  rMachine: RMachine<RA, L>
): Promise<ReactBareToolset<RA, L>> {
  const validateLocale = rMachine.localeHelper.validateLocale;

  const Context = createContext<ReactBareToolsetContext<L> | null>(null);
  Context.displayName = "ReactBareToolsetContext";
  function useReactToolsetContext(): ReactBareToolsetContext<L> {
    const context = useContext(Context);
    if (context === null) {
      throw new RMachineUsageError(ERR_CONTEXT_NOT_FOUND, "ReactBareToolsetContext not found.");
    }

    return context;
  }

  function ReactRMachine({ locale, writeLocale, children }: ReactBareRMachineProps<L>) {
    const value = useMemo<ReactBareToolsetContext<L>>(() => {
      const error = validateLocale(locale);
      if (error) {
        throw new RMachineUsageError(
          ERR_UNKNOWN_LOCALE,
          `Unable to render <ReactRMachine> - invalid locale provided "${locale}".`,
          error
        );
      }

      return { locale, writeLocale };
    }, [locale, writeLocale]);

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  ReactRMachine.probe = (locale: string | undefined) => {
    if (locale !== undefined && rMachine.localeHelper.validateLocale(locale) !== null) {
      locale = undefined;
    }

    return locale as L | undefined;
  };

  function useLocale(): L {
    return useReactToolsetContext().locale;
  }

  async function setLocale(newLocale: L, context: ReactBareToolsetContext<L>) {
    const { locale, writeLocale } = context;
    if (newLocale === locale) {
      return;
    }

    const error = validateLocale(newLocale);
    if (error) {
      throw error;
    }

    if (writeLocale === undefined) {
      throw new RMachineUsageError(ERR_MISSING_WRITE_LOCALE, "No writeLocale function provided to <ReactRMachine>.");
    }

    const writeLocaleResult = writeLocale(newLocale);
    if (writeLocaleResult instanceof Promise) {
      await writeLocaleResult;
    }
  }

  function useSetLocale(): SetLocale<L> {
    const context = useReactToolsetContext();
    return useCallback<SetLocale<L>>((newLocale: L) => setLocale(newLocale, context), [context]);
  }

  const hybridPickR: (typeof rMachine)["hybridPickR"] = (rMachine as any).hybridPickR;
  function useR<N extends Namespace<RA>>(namespace: N): RA[N] {
    const context = useReactToolsetContext();
    const r = hybridPickR(context.locale, namespace);

    if (r instanceof Promise) {
      throw r;
    }
    return r;
  }

  const hybridPickRKit: (typeof rMachine)["hybridPickRKit"] = (rMachine as any).hybridPickRKit;
  function useRKit<NL extends NamespaceList<RA>>(...namespaces: NL): RKit<RA, NL> {
    const context = useReactToolsetContext();
    const rKit = hybridPickRKit(context.locale, ...namespaces);

    if (rKit instanceof Promise) {
      throw rKit;
    }
    return rKit as RKit<RA, NL>;
  }

  return {
    ReactRMachine,
    useLocale,
    useSetLocale,
    useR,
    useRKit,
  };
}
