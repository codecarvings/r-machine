import type { AnyAtlas, RMachine } from "#r-machine";

export abstract class Strategy<A extends AnyAtlas, C> {
  constructor(
    readonly rMachine: RMachine<A>,
    readonly config: C
  ) {}

  private readonly cache = new Map<() => unknown, unknown>();
  protected getCached<T>(factory: () => T): T {
    const result = this.cache.get(factory);
    if (result !== undefined) {
      return result as T;
    }
    const value = factory();
    this.cache.set(factory, value);
    return value;
  }
}
