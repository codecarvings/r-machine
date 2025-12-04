import { Languages } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useSetLocale } from "@/r-machine/toolset";

const localeItems = {
  en: { name: "English" },
  it: { name: "Italiano" },
} as const;

export function LocaleSwitcher() {
  // Get the current locale and the function to change it
  const locale = useLocale();
  const setLocale = useSetLocale();

  const currentLocaleItem = localeItems[locale as keyof typeof localeItems];
  const setLocaleAfterMenuClose = useCallback(
    (newLocale: string) => {
      setTimeout(() => {
        // Delay setting the locale to allow the dropdown to close smoothly
        setLocale(newLocale);
      }, 200);
    },
    [setLocale]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="gap-2 font-semibold">
          <Languages className="size-5" />
          <span className="hidden sm:inline text-base">{currentLocaleItem.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {Object.entries(localeItems).map(([key, { name }]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => setLocaleAfterMenuClose(key)}
            className="cursor-pointer gap-2 text-base py-2"
          >
            <span>{name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
