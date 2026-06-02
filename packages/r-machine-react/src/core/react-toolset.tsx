/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/react, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import type { RMachine } from "r-machine";
import type { AnyResAtlas, ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import { createContext, type ReactNode, use, useCallback, useMemo, useState } from "react";
import { DelayedSuspense, type SuspenseComponent } from "#r-machine/react/utils";
import {
  type CreateReactBareToolsetOptions,
  createReactBareToolset,
  type ReactBareToolset,
} from "./react-bare-toolset.js";
import type { ReactPlugKitMap } from "./react-plug.js";

// THIS IS THE TOOLSET USED BY:
// - REACT STRATEGY CORE
// - REACT STANDARD STRATEGY
// DO NOT RENAME

export type ReactToolset<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  EF extends ExperimentalFlags,
  KM extends ReactPlugKitMap<RA>,
> = Omit<ReactBareToolset<RA, L, EF, KM>, "ReactRMachine"> & {
  readonly ReactRMachine: ReactRMachine;
};

export type ReactRMachine = (props: ReactRMachineProps) => ReactNode;
interface ReactRMachineProps {
  // Only ReactRMachineProps requires fallback because of the async readLocale in ReactImpl
  readonly fallback?: ReactNode; // ReactNode already includes undefined
  readonly Suspense?: SuspenseComponent | null | undefined; // Null means no suspense
  readonly children: ReactNode;
}

export interface ReactImpl<L extends AnyLocale> {
  readonly readLocale: () => L | Promise<L>;
  readonly writeLocale: (newLocale: L) => void | Promise<void>;
}

type ReactToolsetContext<L extends AnyLocale> = [L, (newLocale: L) => void];

export async function createReactToolset<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends ResEquipment<RA>,
  EF extends ExperimentalFlags,
  KM extends ReactPlugKitMap<RA>,
>(
  rMachine: RMachine<RA, L, E, EF>,
  kit: KM,
  impl: ReactImpl<L>,
  options: CreateReactBareToolsetOptions = {}
): Promise<ReactToolset<RA, L, EF, KM>> {
  const { ReactRMachine: OriginalReactRMachine, ...otherTools } = await createReactBareToolset<RA, L, E, EF, KM>(
    rMachine,
    kit,
    options
  );

  const Context = createContext<ReactToolsetContext<L> | null>(null);
  Context.displayName = "ReactToolsetContext";

  function InternalReactRMachine({
    initialLocaleOrPromise,
    children,
  }: {
    readonly initialLocaleOrPromise: L | Promise<L>;
    readonly children: ReactNode;
  }) {
    const initialLocale =
      initialLocaleOrPromise instanceof Promise ? use(initialLocaleOrPromise) : initialLocaleOrPromise;
    const context = useState(initialLocale);
    const [locale, setLocaleContext] = context;

    const writeLocale = useCallback((newLocale: L) => {
      setLocaleContext(newLocale);
      return impl.writeLocale(newLocale);
    }, []);

    // Suspense is already handled in the outer component
    return (
      <Context.Provider value={context}>
        <OriginalReactRMachine locale={locale} writeLocale={writeLocale}>
          {children}
        </OriginalReactRMachine>
      </Context.Provider>
    );
  }

  function ReactRMachine({ fallback, Suspense, children }: ReactRMachineProps) {
    const initialLocaleOrPromise = useMemo(() => impl.readLocale(), []);
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
  };
}
