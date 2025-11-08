import type { AnyNamespace, AnyR } from "./r.js";
import type { AnyNamespaceList, AnyRKit } from "./r-kit.js";
import { type RModuleResolver, resolveR } from "./r-module.js";

function getRKitKey(...namespaces: AnyNamespaceList): string {
  return namespaces.join("⨆");
}

export class Domain {
  constructor(
    readonly locale: string,
    protected readonly rModuleResolver: RModuleResolver
  ) {}

  protected resources = new Map<AnyNamespace, AnyR | Promise<AnyR>>();
  protected pendingRKits = new Map<string, Promise<AnyRKit>>();

  protected resolveR(namespace: AnyNamespace): Promise<AnyR> {
    const r = new Promise<AnyR>((resolve, reject) => {
      resolveR(this.rModuleResolver, namespace, this.locale).then(
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

  protected resolveRKit(namespaces: AnyNamespaceList): Promise<AnyRKit> {
    const key = getRKitKey(...namespaces);
    const totRequestedR = namespaces.length;

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

  // Required for react suspense support
  hybridPickR(namespace: AnyNamespace): AnyR | Promise<AnyR> {
    const r = this.resources.get(namespace);
    if (r !== undefined) {
      // The resource is already resolved or resolving
      return r;
    }

    // The resource has not been resolved yet nor is resolving
    return this.resolveR(namespace);
  }

  pickR(namespace: AnyNamespace): Promise<AnyR> {
    const r = this.resources.get(namespace);
    if (r !== undefined) {
      // The resource is already resolved or resolving
      return Promise.resolve(r);
    }

    // The resource has not been resolved yet nor is resolving
    return this.resolveR(namespace);
  }

  // Required for react suspense support
  hybridPickRKit(namespaces: AnyNamespaceList): AnyRKit | Promise<AnyRKit> {
    if (namespaces.length === 0) {
      return [];
    }

    const initialRKit = namespaces.map((namespace) => this.resources.get(namespace));
    if (initialRKit.every((r) => r !== undefined && !(r instanceof Promise))) {
      // All resources are already resolved
      return initialRKit as AnyRKit;
    }

    return this.resolveRKit(namespaces);
  }

  pickRKit(namespaces: AnyNamespaceList): Promise<AnyRKit> {
    if (namespaces.length === 0) {
      return Promise.resolve([]);
    }

    const initialRKit = namespaces.map((namespace) => this.resources.get(namespace));
    if (initialRKit.every((r) => r !== undefined && !(r instanceof Promise))) {
      // All resources are already resolved
      return Promise.resolve(initialRKit as AnyRKit);
    }

    return this.resolveRKit(namespaces);
  }
}
