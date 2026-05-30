import { localized, Shell } from "@/r-machine/setup";

export const r = Shell.define((plugin) => {
  const { $ } = plugin;
  return localized("shell/common", {
    title: `[${$.locale}] - R-Machine ⧹ Examples ⧹ Next App ⧹ Origin Strategy`,
    footer: {
      message: (
        <>
          Progetto di esempio <strong>R-Machine</strong>. Scopri di più su
          <a href="https://rmachine.dev/it/" className="underline ml-1 font-semibold">
            rmachine.dev/it
          </a>
        </>
      ),
    },
  });
});
