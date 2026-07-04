import { Check, Languages } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/r-machine/setup";
import { Plug } from "@/r-machine/toolset";

const localeItems = {
  en: { name: "English" },
  it: { name: "Italiano" },
} as const;

const plug = Plug();
export function LocaleSwitcher() {
  // Get the current locale and the function to change it
  const { $ } = plug.useR();

  const currentLocaleItem = localeItems[$.locale];
  const setLocaleAfterMenuClose = useCallback(
    (newLocale: Locale) => {
      setTimeout(() => {
        // Delay setting the locale to allow the dropdown to close smoothly
        $.setLocale(newLocale);
      }, 200);
    },
    [$.setLocale]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="default" className="gap-2 font-semibold">
          <Languages className="size-5" />
          <span className="hidden sm:inline text-base">{currentLocaleItem.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-50">
        {Object.entries(localeItems).map(([locale, { name }]) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => setLocaleAfterMenuClose(locale as Locale)}
            className="cursor-pointer gap-2 text-base py-2"
          >
            <Check className={`mr-2 h-4 w-4 ${$.locale === locale ? "opacity-100" : "opacity-0"}`} />
            <span>{name}</span>
            <span className="ms-auto font-mono text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
              {locale}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
LocaleSwitcher.plug = plug;
