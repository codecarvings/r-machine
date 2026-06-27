import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror the tsconfig "@/*" -> "./src/*" path mapping (Vitest does not
    // read tsconfig paths by default).
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // disable `server-only` module in Vitest
      "server-only": "@r-machine/next/dev/no-op",
    },
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // R-Machine packages must be inlined so Vite — not Node's raw ESM loader —
    // resolves their imports. `@r-machine/next` imports Next internals like
    // `next/navigation`; and `verifyResourceAtlas` loads setup.ts through the
    // bundler graph, which a setup file relies on (extensionless TS imports,
    // `import.meta.glob`, etc.). Loading natively would break all of these.
    server: { deps: { inline: ["@r-machine/next", "@r-machine/testing"] } },
  },
}) as ViteUserConfig;
