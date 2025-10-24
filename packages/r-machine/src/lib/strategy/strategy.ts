export abstract class Strategy<C> {
  constructor(protected readonly config: C) {}

  static getConfig<C>(strategy: Strategy<C>): C {
    return strategy.config;
  }
}
