import { localized, Shell } from "@/r-machine/setup";

export const r = Shell.define((plugin) => {
  const { $ } = plugin;
  return localized("shell/common", {
    title: `R-Mart — R-Machine ⧹ Examples ⧹ Next App [${$.locale}]`,
    nav: {
      catalog: "Catalogo",
      cart: "Carrello",
    },
    footer: {
      message: (
        <>
          Esempio e-commerce <strong>R-Machine</strong>. Scopri di più su
          <a href="https://rmachine.dev/it/" className="underline ml-1 font-semibold">
            rmachine.dev/it
          </a>
        </>
      ),
    },
  });
});
