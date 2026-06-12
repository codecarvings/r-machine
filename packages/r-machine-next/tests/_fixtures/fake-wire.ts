/**
 * Controllable fake Wire for adapter tests. Mirrors the wire contract the
 * React adapter (`useBareReactPlug`) depends on (getPluginPromise / subscribe /
 * startTracking / disposeConsumer / updateRequest) with spies + manual control
 * over the resolved plugin and the subscribe channel.
 *
 * Resolved plugins are returned as React-`use()`-fulfilled thenables (a Promise
 * tagged with `status: "fulfilled"` + `value`), so a consumer reads them
 * synchronously without suspending — matching the "resource is cached" path.
 * A `pending` wire returns an unsettled promise so the consumer suspends until
 * `setPlugin` resolves it.
 *
 * Ported from @r-machine/react/tests/_fixtures/fake-wire.ts — the Next client
 * toolset delegates to createReactBareToolset, so its tests need the same wire.
 */
import type { Wire } from "r-machine/core";
import { vi } from "vitest";

// A Promise pre-tagged the way React 19's `use()` recognizes a settled value,
// so reading it during render does not suspend.
function fulfilledThenable(value: unknown): Promise<unknown> {
  const t = Promise.resolve(value) as Promise<unknown> & { status: string; value: unknown };
  t.status = "fulfilled";
  t.value = value;
  return t;
}

export interface FakeWireController {
  readonly wire: Wire;
  readonly startTrackingSpy: ReturnType<typeof vi.fn>;
  readonly commitSpy: ReturnType<typeof vi.fn>;
  readonly unsubscribeSpy: ReturnType<typeof vi.fn>;
  readonly disposeConsumerSpy: ReturnType<typeof vi.fn>;
  readonly updateRequestSpy: ReturnType<typeof vi.fn>;
  /** Fire the subscribe-channel callbacks with a fresh promise identity (the
   * real wire does this on a tracked-dep mutation), keeping the same value. */
  notify(): void;
  /** Resolve a still-pending wire (Suspense → committed) and/or swap the
   * plugin, then notify subscribers. */
  setPlugin(plugin: unknown): void;
}

export interface FakeWireOptions {
  /** Start unresolved so a consumer suspends until `setPlugin` is called. */
  readonly pending?: boolean;
}

export function createFakeWire(plugin: unknown, options: FakeWireOptions = {}): FakeWireController {
  const subscribers = new Set<() => void>();

  let currentValue = plugin;
  let currentPromise: Promise<unknown>;
  let resolvePending: ((value: unknown) => void) | undefined;
  if (options.pending) {
    currentPromise = new Promise<unknown>((resolve) => {
      resolvePending = resolve;
    });
  } else {
    currentPromise = fulfilledThenable(plugin);
  }

  const commitSpy = vi.fn();
  const startTrackingSpy = vi.fn(() => commitSpy);
  const unsubscribeSpy = vi.fn();
  const disposeConsumerSpy = vi.fn();
  const updateRequestSpy = vi.fn();
  const getOwnerSpy = vi.fn(() => null);
  const claimOwnerSpy = vi.fn();

  const wire: Wire = {
    getPluginPromise: () => currentPromise,
    subscribe: (cb: () => void) => {
      subscribers.add(cb);
      return () => {
        unsubscribeSpy();
        subscribers.delete(cb);
      };
    },
    startTracking: startTrackingSpy as never,
    disposeConsumer: disposeConsumerSpy as never,
    updateRequest: updateRequestSpy as never,
    getOwner: getOwnerSpy as never,
    claimOwner: claimOwnerSpy as never,
  };

  const fireSubscribers = () => {
    for (const cb of subscribers) {
      cb();
    }
  };

  return {
    wire,
    startTrackingSpy,
    commitSpy,
    unsubscribeSpy,
    disposeConsumerSpy,
    updateRequestSpy,
    notify: () => {
      currentPromise = fulfilledThenable(currentValue);
      fireSubscribers();
    },
    setPlugin: (next: unknown) => {
      currentValue = next;
      if (resolvePending) {
        // Settle the very promise React suspended on (it tags status on
        // resolution and retries), rather than swapping in a new identity the
        // suspended render never saw.
        resolvePending(next);
        resolvePending = undefined;
      } else {
        currentPromise = fulfilledThenable(next);
      }
      fireSubscribers();
    },
  };
}
