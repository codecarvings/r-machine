"use client";

import { createReactToolset, type ReactToolset } from "@r-machine/react/core";
import { useRouter } from "next/navigation";
import type { AnyAtlas, RMachine } from "r-machine";
import { RMachineError } from "r-machine/errors";
import { type ReactNode, useEffect } from "react";
import type { NextStrategyKind } from "./index.js";

const brand = Symbol("NextClientRMachine");

interface NextClientRMachineProps {
  readonly locale: string;
  readonly children: ReactNode;
}
export interface NextClientRMachine {
  (props: NextClientRMachineProps): ReactNode;
  readonly [brand]: "NextClientRMachine";
}

export type NextClientPlainToolset<A extends AnyAtlas> = Omit<ReactToolset<A>, "ReactRMachine">;

export type NextClientPathToolset<A extends AnyAtlas> = NextClientPlainToolset<A> & {
  readonly usePathBuilder: () => PathBuilder;
};

export type NextClientToolset<SK extends NextStrategyKind, A extends AnyAtlas> = SK extends "path"
  ? NextClientPathToolset<A>
  : NextClientPlainToolset<A>;

type PathBuilder = (path: string) => string;
interface NextClientImplPathAnnex {
  readonly createUsePathBuilder: (useLocale: () => string) => () => PathBuilder;
}

export interface NextClientImpl {
  // biome-ignore lint/suspicious/noConfusingVoidType: As per design
  readonly onLoad: ((locale: string) => void | (() => void)) | undefined;
  readonly writeLocale: (newLocale: string, router: ReturnType<typeof useRouter>) => void | Promise<void>;
  readonly path?: undefined | NextClientImplPathAnnex;
}

export async function createNextClientToolset<SK extends NextStrategyKind, A extends AnyAtlas>(
  strategyKind: SK,
  impl: NextClientImpl,
  rMachine: RMachine<A>,
  onNextClientRMachineCreated: (NextClientRMachine: NextClientRMachine) => void
): Promise<NextClientToolset<SK, A>> {
  if (strategyKind === "plain" && impl.path !== undefined) {
    throw new RMachineError("Path annex is not supported in plain strategy.");
  } else if (strategyKind === "path" && impl.path === undefined) {
    throw new RMachineError("Path annex is required in path strategy.");
  }

  const { ReactRMachine, useLocale, ...otherTools } = await createReactToolset(rMachine);

  async function setLocale(newLocale: string, router: ReturnType<typeof useRouter>): Promise<void> {
    // Do not check if the locale is different
    // The origin strategy allows same locale on multiple origins, so the navigation might still be necessary

    const error = rMachine.localeHelper.validateLocale(newLocale);
    if (error) {
      throw new RMachineError(`Cannot set invalid locale: ${newLocale}.`, error);
    }

    const writeLocaleResult = impl.writeLocale(newLocale, router);
    if (writeLocaleResult instanceof Promise) {
      await writeLocaleResult;
    }
  }

  function useSetLocale(): ReturnType<ReactToolset<A>["useSetLocale"]> {
    const router = useRouter();

    return (newLocale: string) => setLocale(newLocale, router);
  }

  function NextClientRMachine({ locale, children }: NextClientRMachineProps) {
    useEffect(() => {
      if (impl.onLoad !== undefined) {
        return impl.onLoad(locale);
      }
    }, [locale, impl.onLoad]);
    return <ReactRMachine locale={locale}>{children}</ReactRMachine>;
  }
  NextClientRMachine[brand] = "NextClientRMachine" as const;

  let usePathBuilder: (() => PathBuilder) | undefined;
  if (impl.path !== undefined) {
    usePathBuilder = impl.path.createUsePathBuilder(useLocale);
  }

  onNextClientRMachineCreated(NextClientRMachine);
  return {
    ...otherTools,
    useLocale,
    useSetLocale,
    usePathBuilder,
  } as NextClientToolset<SK, A>;
}
