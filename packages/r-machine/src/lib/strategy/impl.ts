import type { AnyAtlas } from "../r.js";
import type { RMachine } from "../r-machine.js";

interface AnyImpl {
  readonly [key: string]: (...args: any[]) => any;
}

interface BinCore<C> {
  readonly strategyConfig: C;
  readonly rMachine: RMachine<AnyAtlas>;
}

// Required for correct type inference
class BinSignature<C, I, O> {
  protected readonly __C?: C;
  protected readonly __I?: I;
  protected readonly __O?: O;
}

type Prettify<T> = { [K in keyof T]: T[K] } & {};
export type Bin<C, I extends object, O extends object> = Prettify<BinCore<C> & I & O> & BinSignature<C, I, O>;

type PartialBin<B extends Bin<any, any, any>> = B extends Bin<infer C, infer I, any> ? Prettify<BinCore<C> & I> : never;

type ExtractBinParameter<F extends (...args: any) => any> = F extends (...args: infer P) => any
  ? Extract<P[number], Bin<any, any, any>>
  : never;

type BinProvider<B extends Bin<any, any, any>> = (partialBin: PartialBin<B>) => B;

type BinProviderMap<I extends AnyImpl> = {
  readonly [K in keyof I]: BinProvider<ExtractBinParameter<I[K]>>;
};

export type ImplPackage<I extends AnyImpl> = {
  readonly impl: I;
  readonly binProviders: BinProviderMap<I>;
};
