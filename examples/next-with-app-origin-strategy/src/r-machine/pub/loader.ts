import { createNextDevImport } from "@r-machine/next/dev";
import { ResourceAtlas } from "@/r-machine/resource-atlas";

const devImport = await createNextDevImport(import.meta.url);

ResourceAtlas.loader.register(["base/", "shell/", "shell/lib/", "outer/", "vertex/"], (path) =>
  devImport ? devImport(`./${path}`) : import(/* @vite-ignore */ `./${path}`)
);
