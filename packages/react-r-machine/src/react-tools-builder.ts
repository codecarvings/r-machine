import { createReactTools } from "./react-tools.js";

interface ReactToolsBuilder {
  readonly create: typeof createReactTools;
}

export const ReactTools: ReactToolsBuilder = {
  create: createReactTools,
};
