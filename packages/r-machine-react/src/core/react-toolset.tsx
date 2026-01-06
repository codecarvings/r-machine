import type { AnyAtlas, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { createContext, type ReactNode, use, useContext, useMemo, useState } from "react";
import { DelayedSuspense, type SuspenseComponent } from "#r-machine/react/utils";
import { createReactBareToolset, type ReactBareToolset } from "./react-bare-toolset.js";

// THIS IS THE BASE TOOLSET USED ALSO BY THE REACT STANDARD STRATEGY
// DO NOT RENAME

export type ReactToolset<A extends AnyAtlas> = Omit<ReactBareToolset<A>, "ReactRMachine"> & {
  readonly ReactRMachine: ReactRMachine;
};

export type ReactRMachine = (props: ReactRMachineProps) => ReactNode;
interface ReactRMachineProps {
  // Only ReactRMachineProps requires fallback because of the async readLocale in ReactImpl
  readonly fallback?: ReactNode; // ReactNode already includes undefined
  readonly Suspense?: SuspenseComponent | null | undefined; // Null means no suspense
  readonly children: ReactNode;
}

export interface ReactImpl {
  readonly readLocale: () => string | Promise<string>;
  readonly writeLocale: (newLocale: string) => void | Promise<void>;
}

type ReactToolsetContext = [string, (newLocale: string) => void];

export async function createReactToolset<A extends AnyAtlas>(
  rMachine: RMachine<A>,
  impl: ReactImpl
): Promise<ReactToolset<A>> {
  const { ReactRMachine: OriginalReactRMachine, ...otherTools } = await createReactBareToolset(rMachine);

  const Context = createContext<ReactToolsetContext | null>(null);
  Context.displayName = "ReactToolsetContext";

  function useReactToolsetContext(): ReactToolsetContext {
    const context = useContext(Context);
    if (context === null) {
      throw new RMachineError("ReactToolsetContext not found.");
    }

    return context;
  }

  async function setLocale(newLocale: string, context: ReactToolsetContext) {
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

  function useSetLocale(): ReturnType<ReactBareToolset<A>["useSetLocale"]> {
    const context = useReactToolsetContext();

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
        <OriginalReactRMachine locale={context[0]}>{children}</OriginalReactRMachine>
      </Context.Provider>
    );
  }

  function ReactRMachine({ fallback, Suspense, children }: ReactRMachineProps) {
    const initialLocaleOrPromise = useMemo(() => impl.readLocale(), [impl.readLocale]);
    const SuspenseComponent = useMemo(
      () => Suspense || (Suspense !== null ? DelayedSuspense.create() : null),
      [Suspense]
    );

    // Do not validate: Suspense === null && initialLocaleOrPromise instanceof Promise
    // (a Suspense could be provided externally)

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
