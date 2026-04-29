import { InnerGear, type RShape } from "../setup";

export const r = InnerGear.define(() => {
  return {
    users: {
      async getAll() {
        return [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
          { id: 3, name: "Charlie" },
        ];
      },
    },
  };
});

export type Inner_DB = RShape<typeof r>;
