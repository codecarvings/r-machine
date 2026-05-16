import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { rMachineHmr } from "./src/r-machine/vite-plugin-r-machine-hmr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), rMachineHmr()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
});
