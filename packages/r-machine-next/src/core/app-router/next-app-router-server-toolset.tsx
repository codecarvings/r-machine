import type { AnyAtlas, AtlasNamespace, AtlasNamespaceList, RKit, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { cache, type JSX, type ReactNode } from "react";
import type { NextClientRMachine } from "#r-machine/next/core";
import { NextAppRouterEntrancePage } from "./next-app-router-entrance-page.js";
import type { NextAppRouterServerImplPackage } from "./next-app-router-server-impl.js";

type RMachineParams<LK extends string> = {
  [P in LK]: string;
};

interface BindLocale<LK extends string> {
  (locale: string): string;
  (params: Promise<RMachineParams<LK>>): Promise<string>;
}

export interface NextAppRouterServerToolset<A extends AnyAtlas, LK extends string> {
  readonly NextServerRMachine: NextAppRouterServerRMachine;
  readonly EntrancePage: EntrancePage;
  readonly generateLocaleStaticParams: LocaleStaticParamsGenerator<LK>;
  readonly bindLocale: BindLocale<LK>;
  readonly getLocale: () => string;
  readonly setLocale: (newLocale: string) => void;
  readonly pickR: <N extends AtlasNamespace<A>>(namespace: N) => Promise<A[N]>;
  readonly pickRKit: <NL extends AtlasNamespaceList<A>>(...namespaces: NL) => Promise<RKit<A, NL>>;
}

interface NextAppRouterServerRMachineProps {
  readonly children: ReactNode;
}
export type NextAppRouterServerRMachine = (props: NextAppRouterServerRMachineProps) => JSX.Element;

type LocaleStaticParamsGenerator<LK extends string> = () => Promise<RMachineParams<LK>[]>;

interface EntrancePageProps {
  readonly locale?: string | undefined | null;
}
type EntrancePage = (props: EntrancePageProps) => Promise<JSX.Element>;

interface NextAppRouterServerRMachineContext {
  value: string | null;
}

export function createNextAppRouterServerToolset<A extends AnyAtlas, LK extends string, C>(
  rMachine: RMachine<A>,
  strategyConfig: C,
  localeKey: LK,
  implPackage: NextAppRouterServerImplPackage<C>,
  NextClientRMachine: NextClientRMachine
): NextAppRouterServerToolset<A, LK> {
  const validateLocale = rMachine.localeHelper.validateLocale;
  const partialBin = { strategyConfig, rMachine };

  const getContext = cache((): NextAppRouterServerRMachineContext => {
    return {
      value: null,
    };
  });

  function NextServerRMachine({ children }: NextAppRouterServerRMachineProps) {
    const locale = getLocale();
    return <NextClientRMachine locale={locale}>{children}</NextClientRMachine>;
  }

  async function EntrancePage({ locale }: EntrancePageProps) {
    // Workaround for typescript error:
    // NextAppRouterServerToolsEntrancePage' cannot be used as a JSX component. Its return type 'Promise<void>' is not a valid JSX element.
    return (
      <>
        {/* @ts-expect-error Async Server Component */}
        <NextAppRouterEntrancePage rMachine={rMachine} locale={locale ?? undefined} setLocale={setLocale} />
      </>
    );
  }

  async function generateLocaleStaticParams() {
    return rMachine.config.locales.map((locale) => ({
      [localeKey]: locale,
    }));
  }

  function bindLocale(locale: string | Promise<RMachineParams<LK>>): string | Promise<string> {
    function syncBindLocale(locale: string): string {
      const validationError = validateLocale(locale);
      if (validationError !== null) {
        const error = new RMachineError(`Invalid locale provided to bindLocale: "${locale}".`, validationError);

        const bin = implPackage.binFactories.onBindLocaleError({
          strategyConfig,
          rMachine,
          localeOption: locale,
        });
        implPackage.impl.onBindLocaleError(error, bin);

        throw error;
      }

      const context = getContext();
      if (context.value !== null) {
        if (locale !== context.value) {
          throw new RMachineError(
            `bindLocale called multiple times with different locales in the same request. Previous: "${context.value}", New: "${locale}".`
          );
        }
      }

      context.value = locale;
      return locale;
    }

    async function asyncBindLocale(localePromise: Promise<RMachineParams<LK>>): Promise<string> {
      const locale = (await localePromise)[localeKey];
      return syncBindLocale(locale);
    }

    if (locale instanceof Promise) {
      return asyncBindLocale(locale);
    } else {
      return syncBindLocale(locale);
    }
  }

  function getLocale(): string {
    const context = getContext();
    if (context.value === null) {
      throw new RMachineError(
        "NextAppRouterServerRMachineContext not initialized. bindLocale not invoked? (you must invoke bindLocale at the beginning of every page or layout component)."
      );
    }
    return context.value;
  }

  function setLocale(newLocale: string) {
    const error = validateLocale(newLocale);
    if (error) {
      throw new RMachineError(`Cannot set locale to invalid locale: "${newLocale}".`, error);
    }

    const bin = implPackage.binFactories.writeLocale(partialBin);
    implPackage.impl.writeLocale(newLocale, bin);
  }

  async function pickR<N extends AtlasNamespace<A>>(namespace: N): Promise<A[N]> {
    const locale = getLocale();
    return rMachine.pickR(locale, namespace) as Promise<A[N]>;
  }

  async function pickRKit<NL extends AtlasNamespaceList<A>>(...namespaces: NL): Promise<RKit<A, NL>> {
    const locale = getLocale();
    return rMachine.pickRKit(locale, ...namespaces) as Promise<RKit<A, NL>>;
  }

  return {
    NextServerRMachine,
    EntrancePage,
    generateLocaleStaticParams: generateLocaleStaticParams as LocaleStaticParamsGenerator<LK>,
    bindLocale: bindLocale as BindLocale<LK>,
    getLocale,
    setLocale,
    pickR,
    pickRKit,
  };
}
