import type { AnyAtlas, RMachine } from "#r-machine";

interface AnyImpl {
  readonly [key: string]: (...args: any[]) => any;
}

interface BinCore<C> {
  readonly strategyConfig: C;
  readonly rMachine: RMachine<AnyAtlas>;
}

// Required for correct type inference & ExtractBinParameter
const c = Symbol("C");
const i = Symbol("I");
const o = Symbol("O");
class BinSignature<C, I, O> {
  protected readonly [c]?: C;
  protected readonly [i]?: I;
  protected readonly [o]?: O;
}

type Prettify<T> = { [K in keyof T]: T[K] } & {};
export type Bin<C, I extends object, O extends object> = Prettify<BinCore<C> & I & O> & BinSignature<C, I, O>;

type PartialBin<B extends Bin<any, any, any>> = B extends Bin<infer C, infer I, any> ? Prettify<BinCore<C> & I> : never;

type ExtractBinParameter<F extends (...args: any) => any> = F extends (...args: infer P) => any
  ? Extract<P[number], BinSignature<any, any, any>>
  : never;

type BinFactory<B extends Bin<any, any, any>> = (partialBin: PartialBin<B>) => B;

export type BinFactoryMap<I extends AnyImpl> = {
  readonly [K in keyof I]: BinFactory<ExtractBinParameter<I[K]>>;
};

export type ImplPackage<I extends AnyImpl> = {
  readonly impl: I;
  readonly binFactories: BinFactoryMap<I>;
};

export function defaultBinFactory<T>(partialBin: T): T {
  return partialBin;
}
