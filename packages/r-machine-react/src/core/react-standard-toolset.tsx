import type { AnyAtlas, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { createContext, type JSX, type ReactNode, useContext, useState } from "react";
import { createReactToolset, type ReactToolset } from "./react-toolset.js";

interface ReactStandardRMachineProps {
  readonly children: ReactNode;
}
export type ReactStandardRMachine = (props: ReactStandardRMachineProps) => JSX.Element;

export type ReactStandardToolset<A extends AnyAtlas> = Omit<ReactToolset<A>, "ReactRMachine"> & {
  readonly ReactRMachine: ReactStandardRMachine;
};

type ReactStandardToolsetContext = [string, (newLocale: string) => void];

export type ReactStandardImpl = {
  readonly readLocale: () => string;
  readonly writeLocale: (newLocale: string) => void;
};

export function createReactStandardToolset<A extends AnyAtlas>(
  rMachine: RMachine<A>,
  impl: ReactStandardImpl
): ReactStandardToolset<A> {
  const { ReactRMachine: InternalReactRMachine, ...otherTools } = createReactToolset(rMachine);

  const Context = createContext<ReactStandardToolsetContext | null>(null);
  Context.displayName = "ReactStandardToolsetContext";

  function useReactStandardToolsetContext(): ReactStandardToolsetContext {
    const context = useContext(Context);
    if (context === null) {
      throw new RMachineError("ReactStandardToolsetContext not found.");
    }

    return context;
  }

  function setLocale(newLocale: string, context: ReactStandardToolsetContext): void {
    const [locale, setLocaleContext] = context;
    if (newLocale === locale) {
      return;
    }

    const error = rMachine.localeHelper.validateLocale(newLocale);
    if (error) {
      throw new RMachineError(`Cannot set invalid locale: ${newLocale}.`, error);
    }

    setLocaleContext(newLocale);
    impl.writeLocale(newLocale);
  }

  function useSetLocale(): ReturnType<ReactToolset<A>["useSetLocale"]> {
    const context = useReactStandardToolsetContext();

    return (newLocale: string) => {
      setLocale(newLocale, context);
    };
  }

  function ReactRMachine({ children }: ReactStandardRMachineProps) {
    const context = useState(impl.readLocale);

    return (
      <Context.Provider value={context}>
        <InternalReactRMachine locale={context[0]}>{children}</InternalReactRMachine>
      </Context.Provider>
    );
  }

  return {
    ...otherTools,
    ReactRMachine,
    useSetLocale,
  };
}
