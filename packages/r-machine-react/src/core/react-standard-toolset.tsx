import type { AnyAtlas, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { createContext, type JSX, type ReactNode, useContext, useState } from "react";
import type { ReactStandardImplPackage } from "./react-standard-impl.js";
import { createReactToolset, type ReactToolset } from "./react-toolset.js";

interface ReactStandardRMachineProps {
  readonly children: ReactNode;
}
export type ReactStandardRMachine = (props: ReactStandardRMachineProps) => JSX.Element;

export type ReactStandardToolset<A extends AnyAtlas> = Omit<ReactToolset<A>, "ReactRMachine"> & {
  readonly ReactRMachine: ReactStandardRMachine;
};

type ReactStandardToolsetContext = [string, (newLocale: string) => void];

export function createReactStandardToolset<A extends AnyAtlas, C>(
  rMachine: RMachine<A>,
  strategyConfig: C,
  implPackage: ReactStandardImplPackage<C>
): ReactStandardToolset<A> {
  const { ReactRMachine: InternalReactRMachine, ...otherTools } = createReactToolset(rMachine);
  const validateLocale = rMachine.localeHelper.validateLocale;
  const partialBin = { strategyConfig, rMachine };

  const Context = createContext<ReactStandardToolsetContext | null>(null);
  Context.displayName = "ReactStandardToolsetContext";

  function useReactStandardToolsetContext(): ReactStandardToolsetContext {
    const context = useContext(Context);
    if (context === null) {
      throw new RMachineError("ReactStandardToolsetContext not found.");
    }

    return context;
  }

  function setLocale(
    newLocale: string,
    context: ReactStandardToolsetContext,
    writeLocaleBin: Parameters<typeof implPackage.impl.writeLocale>[1]
  ): void {
    const [locale, setLocaleContext] = context;
    if (newLocale === locale) {
      return;
    }

    const error = validateLocale(newLocale);
    if (error) {
      throw error;
    }

    setLocaleContext(newLocale);
    implPackage.impl.writeLocale(newLocale, writeLocaleBin);
  }

  function useSetLocale(): ReturnType<ReactToolset<A>["useSetLocale"]> {
    const context = useReactStandardToolsetContext();
    const bin = implPackage.binFactories.writeLocale(partialBin);

    return (newLocale: string) => {
      setLocale(newLocale, context, bin);
    };
  }

  function readLocale(): string {
    const bin = implPackage.binFactories.readLocale(partialBin);
    return implPackage.impl.readLocale(bin);
  }

  function ReactRMachine({ children }: ReactStandardRMachineProps) {
    const context = useState(readLocale);

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
