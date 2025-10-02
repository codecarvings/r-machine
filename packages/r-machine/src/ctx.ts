import { RMachineError } from "./error.js";
import type { AnyNamespace, AnyR } from "./r.js";
import { type AnyNamespaceList, type AnyRKit, getRKitKey } from "./r-kit.js";

export class Ctx {
  constructor(
    readonly locale: string,
    protected rLoader: (namespace: AnyNamespace, locale: string) => Promise<AnyR>
  ) {}

  protected rs = new Map<AnyNamespace, AnyR | Promise<AnyR>>();
  protected pendingRKits = new Map<string, Promise<AnyRKit>>();

  protected loadR(namespace: AnyNamespace): Promise<AnyR> {
    const r = new Promise<AnyR>((resolve, reject) => {
      void this.rLoader(this.locale, namespace).then(
        (resolvedR) => {
          this.rs.set(namespace, resolvedR);

          resolve(resolvedR);
        },
        (reason) => {
          this.rs.delete(namespace);

          const error = new RMachineError(`Unable to load resource "${namespace}" for locale "${this.locale}"`, reason);
          console.error(error);
          reject(error);
        }
      );
    });

    this.rs.set(namespace, r);
    return r;
  }

  pickR(namespace: AnyNamespace): AnyR | Promise<AnyR> {
    const r = this.rs.get(namespace);
    if (r !== undefined) {
      // The resource is already loaded or loading
      return r;
    } else {
      // The resource has not been loaded yet nor is loading
      return this.loadR(namespace);
    }
  }

  pickRKit(...namespaces: AnyNamespaceList): AnyRKit | Promise<AnyRKit> {
    const totRequestedR = namespaces.length;
    if (totRequestedR === 0) {
      return [];
    }

    const initialRKit = namespaces.map((namespace) => this.rs.get(namespace));
    if (initialRKit.every((r) => r !== undefined && !(r instanceof Promise))) {
      // All resources are already loaded
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
      const rKit = namespaces.map((namespace) => this.rs.get(namespace));

      let totReadyR = 0;
      const onRReady = () => {
        totReadyR++;
        if (totReadyR === totRequestedR) {
          this.pendingRKits.delete(key);
          resolve(rKit as AnyRKit);
        }
      };
      const onRLoadFail = (reason: unknown) => {
        this.pendingRKits.delete(key);
        reject(reason);
      };

      rKit.forEach((r, i) => {
        if (r !== undefined) {
          // The resource is already loaded or loading
          if (r instanceof Promise) {
            // The resource is loading
            r.then(
              (resolvedR) => {
                // Finished loading - Success
                rKit[i] = resolvedR;
                onRReady();
              },
              (reason) => {
                // Finished loading - Fail
                onRLoadFail(reason);
              }
            );
          } else {
            // The resource is already loaded
            onRReady();
          }
        } else {
          // The resource is not loaded nor loading
          const namespace = namespaces[i];
          void this.loadR(namespace).then(
            (resolvedR) => {
              rKit[i] = resolvedR;
              onRReady();
            },
            (reject) => {
              onRLoadFail(reject);
            }
          );
        }
      });
    });

    this.pendingRKits.set(key, pendingRKit);
    return pendingRKit;
  }
}
