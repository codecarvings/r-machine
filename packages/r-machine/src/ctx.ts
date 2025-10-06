import type { AnyNamespace, AnyR } from "./r.js";
import { type AnyNamespaceList, type AnyRKit, getRKitKey } from "./r-kit.js";
import { type RModuleResolver, resolveR } from "./r-module.js";

export class Ctx {
  constructor(
    readonly locale: string,
    protected readonly rModuleResolver: RModuleResolver
  ) {}

  protected resources = new Map<AnyNamespace, AnyR | Promise<AnyR>>();
  protected pendingRKits = new Map<string, Promise<AnyRKit>>();

  protected resolveR(namespace: AnyNamespace): Promise<AnyR> {
    const r = new Promise<AnyR>((resolve, reject) => {
      resolveR(this.rModuleResolver, this.locale, namespace).then(
        (r) => {
          this.resources.set(namespace, r);
          resolve(r);
        },
        (reason) => {
          this.resources.delete(namespace);
          reject(reason);
        }
      );
    });

    this.resources.set(namespace, r);
    return r;
  }

  pickR(namespace: AnyNamespace): AnyR | Promise<AnyR> {
    const r = this.resources.get(namespace);
    if (r !== undefined) {
      // The resource is already resolved or resolving
      return r;
    }

    // The resource has not been resolved yet nor is resolving
    return this.resolveR(namespace);
  }

  pickRKit(...namespaces: AnyNamespaceList): AnyRKit | Promise<AnyRKit> {
    const totRequestedR = namespaces.length;
    if (totRequestedR === 0) {
      return [];
    }

    const initialRKit = namespaces.map((namespace) => this.resources.get(namespace));
    if (initialRKit.every((r) => r !== undefined && !(r instanceof Promise))) {
      // All resources are already resolved
      return initialRKit as AnyRKit;
    }

    const key = getRKitKey(...namespaces);

    let pendingRKit = this.pendingRKits.get(key);
    if (pendingRKit) {
      // The same RKit have been requested before
      // but it's not ready, return the existing promise
      return pendingRKit;
    }

    pendingRKit = new Promise<AnyRKit>((resolve, reject) => {
      // Must re-check the current state of each resource
      const rKit = namespaces.map((namespace) => this.resources.get(namespace));

      let totRFulfilled = 0;
      const onResolveFulfilled = () => {
        totRFulfilled++;
        if (totRFulfilled === totRequestedR) {
          this.pendingRKits.delete(key);
          resolve(rKit as AnyRKit);
        }
      };
      const onResolveRejected = (reason: unknown) => {
        this.pendingRKits.delete(key);
        reject(reason);
      };

      rKit.forEach((r, i) => {
        if (r !== undefined) {
          // The resource is already resolved or resolving
          if (r instanceof Promise) {
            // The resource is resolving
            r.then(
              (resolvedR) => {
                // Finished resolving - Success
                rKit[i] = resolvedR;
                onResolveFulfilled();
              },
              (reason) => {
                // Finished resolving - Fail
                onResolveRejected(reason);
              }
            );
          } else {
            // The resource is already resolved
            onResolveFulfilled();
          }
        } else {
          // The resource is not resolved nor resolving
          const namespace = namespaces[i];
          void this.resolveR(namespace).then(
            (resolvedR) => {
              rKit[i] = resolvedR;
              onResolveFulfilled();
            },
            (reject) => {
              onResolveRejected(reject);
            }
          );
        }
      });
    });

    this.pendingRKits.set(key, pendingRKit);
    return pendingRKit;
  }
}
