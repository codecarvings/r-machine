import "server-only";
import { createNextDevImport } from "@r-machine/next/dev";
import { ResourceAtlas } from "@/r-machine/resource-atlas";

const devImport = await createNextDevImport(import.meta.url);

// Server-only loaders. Behind `import "server-only"` and rooted at this folder
// (`prv/`), so the `import()` glob over server-only resources never reaches the
// client bundle. Imported for its side effect by server-toolset.ts.
ResourceAtlas.loader.register(["inner/"], (path) =>
  devImport ? devImport(`./${path}`) : import(/* @vite-ignore */ `./${path}`)
);
