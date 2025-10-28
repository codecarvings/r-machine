export abstract class Strategy<C> {
  constructor(protected readonly config: C) {}
}
