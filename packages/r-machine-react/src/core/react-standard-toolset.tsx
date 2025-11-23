import type { AnyAtlas, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { createContext, type ReactNode, use, useContext, useMemo, useState } from "react";
import { DelayedSuspense, type SuspenseComponent } from "#r-machine/react/utils";
import { createReactToolset, type ReactToolset } from "./react-toolset.js";

interface ReactStandardRMachineProps {
  readonly fallback?: ReactNode; // ReactNode already includes undefined
  readonly Suspense?: SuspenseComponent | null | undefined; // Null means no suspense
  readonly children: ReactNode;
}
export type ReactStandardRMachine = (props: ReactStandardRMachineProps) => ReactNode;

export type ReactStandardToolset<A extends AnyAtlas> = Omit<ReactToolset<A>, "ReactRMachine"> & {
  readonly ReactRMachine: ReactStandardRMachine;
};

type ReactStandardToolsetContext = [string, (newLocale: string) => void];

export type ReactStandardImpl = {
  readonly readLocale: () => string | Promise<string>;
  readonly writeLocale: (newLocale: string) => void | Promise<void>;
};

export function createReactStandardToolset<A extends AnyAtlas>(
  rMachine: RMachine<A>,
  impl: ReactStandardImpl
): ReactStandardToolset<A> {
  const { ReactRMachine: OriginalReactRMachine, ...otherTools } = createReactToolset(rMachine);

  const Context = createContext<ReactStandardToolsetContext | null>(null);
  Context.displayName = "ReactStandardToolsetContext";

  function useReactStandardToolsetContext(): ReactStandardToolsetContext {
    const context = useContext(Context);
    if (context === null) {
      throw new RMachineError("ReactStandardToolsetContext not found.");
    }

    return context;
  }

  async function setLocale(newLocale: string, context: ReactStandardToolsetContext) {
    const [locale, setLocaleContext] = context;
    if (newLocale === locale) {
      return;
    }

    const error = rMachine.localeHelper.validateLocale(newLocale);
    if (error) {
      throw new RMachineError(`Cannot set invalid locale: "${newLocale}".`, error);
    }

    setLocaleContext(newLocale);
    const writeLocaleResult = impl.writeLocale(newLocale);
    if (writeLocaleResult instanceof Promise) {
      await writeLocaleResult;
    }
  }

  function useSetLocale(): ReturnType<ReactToolset<A>["useSetLocale"]> {
    const context = useReactStandardToolsetContext();

    return (newLocale: string) => setLocale(newLocale, context);
  }

  function InternalReactRMachine({
    initialLocaleOrPromise,
    children,
  }: {
    readonly initialLocaleOrPromise: string | Promise<string>;
    readonly children: ReactNode;
  }) {
    const initialLocale =
      initialLocaleOrPromise instanceof Promise ? use(initialLocaleOrPromise) : initialLocaleOrPromise;
    const context = useState(initialLocale);

    // Suspense is already handled in the outer component
    return (
      <Context.Provider value={context}>
        <OriginalReactRMachine locale={context[0]} Suspense={null}>
          {children}
        </OriginalReactRMachine>
      </Context.Provider>
    );
  }

  function ReactRMachine({ fallback, Suspense, children }: ReactStandardRMachineProps) {
    const initialLocaleOrPromise = useMemo(() => impl.readLocale(), [impl.readLocale]);
    const SuspenseComponent = useMemo(
      () => Suspense || (Suspense !== null ? DelayedSuspense.create() : null),
      [Suspense]
    );

    if (Suspense === null && initialLocaleOrPromise instanceof Promise) {
      throw new RMachineError(
        "<ReactRMachine> cannot have Suspense set to null when the initial locale is loaded asynchronously."
      );
    }

    if (SuspenseComponent !== null) {
      return (
        <SuspenseComponent fallback={fallback}>
          <InternalReactRMachine initialLocaleOrPromise={initialLocaleOrPromise}>{children}</InternalReactRMachine>
        </SuspenseComponent>
      );
    } else {
      return <InternalReactRMachine initialLocaleOrPromise={initialLocaleOrPromise}>{children}</InternalReactRMachine>;
    }
  }

  return {
    ...otherTools,
    ReactRMachine,
    useSetLocale,
  };
}
