import type { AnyNamespace, AnyR } from "./r.js";
import { RMachineError } from "./r-machine-error.js";

export interface R$ {
  readonly locale: string;
  readonly namespace: string;
}

export type AnyRFactory = ($?: R$) => AnyR | Promise<AnyR>;

export type AnyRForge = AnyR | AnyRFactory;

export interface AnyRModule {
  readonly default: AnyRForge;
}

export type RModuleResolver = (locale: string, namespace: AnyNamespace) => Promise<AnyRModule>;

function getResolveRFromModuleError(
  locale: string,
  namespace: AnyNamespace,
  reason: string,
  innerError?: Error | undefined
) {
  const error = new RMachineError(
    `Unable to resolve resource "${namespace}" for locale "${locale}" - ${reason}`,
    innerError
  );
  console.error(error);
  return error;
}

export function resolveRFromModule(rModule: AnyRModule, $: R$): Promise<AnyR> {
  return new Promise<AnyR>((resolve, reject) => {
    if (!rModule || typeof rModule !== "object") {
      reject(getResolveRFromModuleError($.locale, $.namespace, "module is not an object"));
      return;
    }

    const processFactoryResult = (r: any) => {
      const rType = typeof r;
      if (rType === "object") {
        if (r !== null) {
          resolve(r);
        } else {
          reject(getResolveRFromModuleError($.locale, $.namespace, "resource returned by factory is null"));
        }
      } else {
        reject(
          getResolveRFromModuleError($.locale, $.namespace, `invalid resource type returned by factory (${rType})`)
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
          (reason) => reject(getResolveRFromModuleError($.locale, $.namespace, "factory promise rejected", reason))
        );
      } else {
        // The factory returned the resource directly
        processFactoryResult(r);
      }
    } else if (rForgeType === "object") {
      if (rForge !== null) {
        resolve(rForge);
      } else {
        reject(getResolveRFromModuleError($.locale, $.namespace, "exported resource is null"));
      }
    } else {
      reject(getResolveRFromModuleError($.locale, $.namespace, `invalid export type (${rForgeType})`));
    }
  });
}

export function resolveR(rModuleResolver: RModuleResolver, locale: string, namespace: AnyNamespace): Promise<AnyR> {
  return new Promise<AnyR>((resolve, reject) => {
    rModuleResolver(locale, namespace).then(
      (resolvedRModule) => {
        resolveRFromModule(resolvedRModule, { locale, namespace }).then(resolve, reject);
      },
      (reason) => {
        const error = new RMachineError(
          `Unable to resolve resource module "${namespace}" for locale "${locale}" - rModuleResolver failed`,
          reason
        );
        console.error(error);
        reject(error);
      }
    );
  });
}
