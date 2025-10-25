import { RMachineError } from "../common/r-machine-error.js";
import type { AnyNamespace, AnyR } from "./r.js";

export interface R$ {
  readonly namespace: string;
  readonly locale: string;
}

export type AnyRFactory = ($?: R$) => AnyR | Promise<AnyR>;

export type AnyRForge = AnyR | AnyRFactory;

export interface AnyRModule {
  readonly default: AnyRForge;
}

export type RModuleResolver = (namespace: AnyNamespace, locale: string) => Promise<AnyRModule>;

function getResolveRFromModuleError(
  namespace: AnyNamespace,
  locale: string,
  reason: string,
  innerError?: Error | undefined
) {
  const error = new RMachineError(
    `Unable to resolve resource "${namespace}" for locale "${locale}" - ${reason}.`,
    innerError
  );
  console.error(error);
  return error;
}

export function resolveRFromModule(rModule: AnyRModule, $: R$): Promise<AnyR> {
  return new Promise<AnyR>((resolve, reject) => {
    if (!rModule || typeof rModule !== "object") {
      reject(getResolveRFromModuleError($.namespace, $.locale, "module is not an object"));
      return;
    }

    const processFactoryResult = (r: any) => {
      const rType = typeof r;
      if (rType === "object") {
        if (r !== null) {
          resolve(r);
        } else {
          reject(getResolveRFromModuleError($.namespace, $.locale, "resource returned by factory is null"));
        }
      } else {
        reject(
          getResolveRFromModuleError($.namespace, $.namespace, `invalid resource type returned by factory (${rType})`)
        );
      }
    };

    const rForge = rModule.default;
    const rForgeType = typeof rForge;
    if (rForgeType === "function") {
      // The module exports a factory function
      const r = (rForge as AnyRFactory)($);

      if (r instanceof Promise) {
        // The factory returned a promise, wait for it to resolve
        r.then(
          (resolvedR) => {
            processFactoryResult(resolvedR);
          },
          (reason) => reject(getResolveRFromModuleError($.namespace, $.locale, "factory promise rejected", reason))
        );
      } else {
        // The factory returned the resource directly
        processFactoryResult(r);
      }
    } else if (rForgeType === "object") {
      if (rForge !== null) {
        resolve(rForge);
      } else {
        reject(getResolveRFromModuleError($.namespace, $.locale, "exported resource is null"));
      }
    } else {
      reject(getResolveRFromModuleError($.namespace, $.locale, `invalid export type (${rForgeType})`));
    }
  });
}

export function resolveR(rModuleResolver: RModuleResolver, namespace: AnyNamespace, locale: string): Promise<AnyR> {
  return new Promise<AnyR>((resolve, reject) => {
    rModuleResolver(namespace, locale).then(
      (resolvedRModule) => {
        resolveRFromModule(resolvedRModule, { namespace, locale }).then(resolve, reject);
      },
      (reason) => {
        const error = new RMachineError(
          `Unable to resolve resource module "${namespace}" for locale "${locale}" - rModuleResolver failed.`,
          reason
        );
        console.error(error);
        reject(error);
      }
    );
  });
}
