// vite-plugin-r-machine-hmr.ts
import type { Plugin } from "vite";

// This plugin enables HMR for RMachine resource modules in a Vite development environment.
// Change detection is based on custom "r-machine:update" events sent from the client when
// a resource module file changes.

// Change it as needed to fit your project structure and module paths.

const R_MACHINE_DIR = import.meta.dirname;
const EXT_RE = /\.(ts|tsx)$/;

export function rMachineHmr(): Plugin {
  return {
    name: "r-machine:hmr",
    apply: "serve",
    hotUpdate({ file, type }) {
      if (this.environment.name !== "client") {
        return;
      }
      if (!EXT_RE.test(file)) {
        return;
      }
      const prefix = `${R_MACHINE_DIR}/`;
      if (!file.startsWith(prefix)) {
        return;
      }
      const relativePath = file.slice(prefix.length).replace(EXT_RE, "");
      if (!relativePath.includes("/")) {
        return;
      }

      if (type === "delete") {
        this.environment.hot.send({ type: "full-reload" });
        return [];
      }

      if (type !== "update") {
        return;
      }

      this.environment.hot.send({
        type: "custom",
        event: "r-machine:update",
        data: {
          file: relativePath,
          changeType: type,
          timestamp: Date.now(),
        },
      });

      return [];
    },
  };
}
