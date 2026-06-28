import { fileURLToPath } from "node:url";
import { defineConfig, type ViteUserConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirror the tsconfig "@/*" -> "./src/*" path mapping (Vitest does not read
    // tsconfig paths). Resource modules import the setup/atlas via this alias,
    // so without it `verifyResourceAtlas` cannot load them.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    // Inline so Vite — not Node's raw ESM loader — resolves `@r-machine/testing`
    // and `r-machine` to a SINGLE `plug.ts` instance. Otherwise mockPlug and the
    // resolved plug live in two module instances and `getPlugResolve` reads
    // `undefined` (see project memory: testing_dual_plug_instance).
    server: { deps: { inline: ["@r-machine/testing"] } },
  },
}) as ViteUserConfig;
