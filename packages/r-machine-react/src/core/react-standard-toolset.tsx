import type { AnyAtlas, RMachine } from "r-machine";
import type { RMachineError } from "r-machine/errors";
import type { JSX, ReactNode } from "react";
import type { ReactToolset } from "./react-toolset.js";

interface ReactStandardRMachineProps {
  readonly children: ReactNode;
}
export type ReactStandardRMachine = (props: ReactStandardRMachineProps) => JSX.Element;

export type ReactStandardToolset<A extends AnyAtlas> = Omit<ReactToolset<A>, "ReactRMachine"> & {
  readonly ReactStandardRMachine: ReactStandardRMachine;
};

function setLocale(
  locale: string,
  newLocale: string,
  writeLocaleBin: unknown,
  validateLocale: (locale: string) => RMachineError | null,
  writeLocale: (newLocale: string, bin: any) => void
) {
  if (newLocale === locale) {
    return;
  }

  const error = validateLocale(newLocale);
  if (error) {
    throw error;
  }

  writeLocale(newLocale, writeLocaleBin);
}

export function createReactStandardToolset<A extends AnyAtlas, C>(
  rMachine: RMachine<A>,
  strategyConfig: C,
  implPackage: ReactStandardImplPackage<C>
): ReactStandardToolset<A> {
  const { ReactRMachine, useLocale: useInternalLocale, ...otherTools } = createReactToolset(rMachine);
  const validateLocale = rMachine.localeHelper.validateLocale;
  const writeLocale = implPackage.impl.writeLocale;

  function useLocale(): ReturnType<ReactToolset<A>["useLocale"]> {
    const [locale] = useInternalLocale();
    const bin = implPackage.binFactories.writeLocale({ strategyConfig, rMachine });

    return [
      locale,
      (newLocale: string) => {
        setLocale(locale, newLocale, bin, validateLocale, writeLocale);
      },
    ];
  }

  function ReactStandardRMachine({ children }: ReactStandardRMachineProps) {
    return <ReactRMachine locale={locale}>{children}</ReactRMachine>;
  }

  return {
    ...otherTools,
    ReactStandardRMachine: ReactStandardRMachine as ReactStandardRMachine,
    useLocale,
  };
}
