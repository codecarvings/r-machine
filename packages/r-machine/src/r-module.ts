import { RMachineError } from "../r-machine-error.js";
import type { AnyNamespace, AnyR } from "./r.js";

export interface R$ {
  readonly locale: string;
  readonly namespace: string;
}

export type AnyRFactory = ($?: R$) => AnyR | Promise<AnyR>;

export type AnyRForge = AnyR | AnyRFactory;

export interface AnyRModule {
  readonly r: AnyRForge;
}

export type RModuleResolver = (locale: string, namespace: AnyNamespace) => Promise<AnyRModule>;

export function resolveRFromModule(rModule: AnyRModule, $: R$): AnyR | Promise<AnyR> {
  return new Promise<AnyR>((resolve, reject) => {
    if (typeof rModule.r === "function") {
      // The module exports a factory function
      const r = rModule.r($);

      if (r instanceof Promise) {
        // The factory returned a promise, wait for it to resolve
        r.then(
          (resolvedR) => {
            resolve(resolvedR);
          },
          (reason) => {
            const error = new RMachineError(
              `Unable to resolve resource "${$.namespace}" for locale "${$.locale}" (factory failed)`,
              reason
            );
            console.error(error);
            reject(error);
          }
        );
      } else {
        // The factory returned the resource directly
        resolve(r);
      }
    } else {
      // The module exports the resource directly
      resolve(rModule.r);
    }
  });
}

export function resolveR(rModuleResolver: RModuleResolver, locale: string, namespace: AnyNamespace): Promise<AnyR> {
  return new Promise<AnyR>((resolve, reject) => {
    rModuleResolver(locale, namespace).then(
      (resolvedRModule) => {
        const r = resolveRFromModule(resolvedRModule, { locale, namespace });
        if (r instanceof Promise) {
          r.then(resolve, reject);
        } else {
          resolve(r);
        }
      },
      (reason) => {
        const error = new RMachineError(
          `Unable to resolve resource module "${namespace}" for locale "${locale}" (rModuleResolver failed)`,
          reason
        );
        console.error(error);
        reject(error);
      }
    );
  });
}
