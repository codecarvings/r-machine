import { OuterGear, type RShape } from "../setup";

// A vertex gear (gear:outer(vertex) per the layout). Each consumer gets its
// OWN instance — unless they share a <VertexFrame>, in which case all
// consumers under the frame read the same instance.
export const r = OuterGear.withState({ count: 0 }).define((plugin, _) => {
  const { $ } = plugin;

  return {
    count: _.getter(() => $.state.count),
    inc: _.action(() => ({ count: $.state.count + 1 })),
  };
});

export type Vertex_Counter = RShape<typeof r>;
