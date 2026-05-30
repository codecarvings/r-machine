import { type RShape, Shell } from "@/r-machine/setup";

export const r = Shell.define((plugin) => {
  const { $ } = plugin;
  return {
    title: `[${$.locale}] - R-Machine ⧹ Examples ⧹ Next App ⧹ Path Strategy`,
    footer: {
      message: (
        <>
          <strong>R-Machine</strong> example project. Learn more at
          <a href="https://rmachine.dev" className="underline ml-1 font-semibold">
            rmachine.dev
          </a>
        </>
      ),
    },
  };
});

export type Shell_Common = RShape<typeof r>;
