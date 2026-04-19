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
import type { AnyResAtlas, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import { createContext, type ReactNode, use, useMemo, useState } from "react";
import { DelayedSuspense, type SuspenseComponent } from "#r-machine/react/utils";
import { createReactBareToolset, type ReactBareToolset } from "./react-bare-toolset.js";

// THIS IS THE TOOLSET USED BY:
// - REACT STRATEGY CORE
// - REACT STANDARD STRATEGY
// DO NOT RENAME

export type ReactToolset<RA extends AnyResAtlas, L extends AnyLocale, E extends ResEquipment<RA>> = Omit<
  ReactBareToolset<RA, L, E>,
  "ReactRMachine"
> & {
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

export async function createReactToolset<RA extends AnyResAtlas, L extends AnyLocale, E extends ResEquipment<RA>>(
  rMachine: RMachine<RA, L, E>,
  impl: ReactImpl<L>
): Promise<ReactToolset<RA, L, E>> {
  const { ReactRMachine: OriginalReactRMachine, ...otherTools } = await createReactBareToolset(rMachine);

  const Context = createContext<ReactToolsetContext<L> | null>(null);
  Context.displayName = "ReactToolsetContext";

  // TODO: WP
  /*
  function useReactToolsetContext(): ReactToolsetContext<L> {
    const context = useContext(Context);
    if (context === null) {
      throw new RMachineUsageError(ERR_CONTEXT_NOT_FOUND, "ReactToolsetContext not found.");
    }

    return context;
  }

  async function setLocale(newLocale: L, context: ReactToolsetContext<L>) {
    const [locale, setLocaleContext] = context;
    if (newLocale === locale) {
      return;
    }

    const error = rMachine.localeHelper.validateLocale(newLocale);
    if (error) {
      throw new RMachineUsageError(ERR_UNKNOWN_LOCALE, `Cannot set invalid locale: "${newLocale}".`, error);
    }

    setLocaleContext(newLocale);
    const writeLocaleResult = impl.writeLocale(newLocale);
    if (writeLocaleResult instanceof Promise) {
      await writeLocaleResult;
    }
  }

  function useSetLocale(): ReturnType<ReactBareToolset<RA, L, KA>["useSetLocale"]> {
    const context = useReactToolsetContext();

    return (newLocale: L) => setLocale(newLocale, context);
  }
  */

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

    // Suspense is already handled in the outer component
    return (
      <Context.Provider value={context}>
        <OriginalReactRMachine locale={context[0]}>{children}</OriginalReactRMachine>
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
