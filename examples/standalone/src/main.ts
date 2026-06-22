import { localeHelper } from "./r-machine/setup.ts";
import { render } from "./render.ts";

// No plug here — just drive the renderer over every configured locale.
for (const locale of localeHelper.locales) {
  console.log(await render(locale));
}
