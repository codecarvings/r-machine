import { type RShape, Shell } from "@/r-machine/setup";

export const r = Shell.define((plugin) => {
  const { $ } = plugin;
  return {
    title: `R-Mart — R-Machine ⧹ Examples ⧹ Next App [${$.locale}]`,
    nav: {
      catalog: "Catalog",
      cart: "Cart",
    },
    footer: {
      message: (
        <>
          <strong>R-Machine</strong> e-commerce example. Learn more at
          <a href="https://rmachine.dev" className="underline ml-1 font-semibold">
            rmachine.dev
          </a>
        </>
      ),
    },
  };
});

export type Shell_Common = RShape<typeof r>;
