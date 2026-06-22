import Image from "next/image";
import Link from "next/link";
import { CartBadge } from "@/components/client/cart-badge";
import { LocaleSwitcher } from "@/components/client/locale-switcher";
import RMachineLogo from "@/gfx/r-machine.logo.svg";
import { ServerPlug } from "@/r-machine/server-toolset";

// Nav labels come from `shell/common`; links are built with the locale-bound
// `$.getPath`, so navigation always stays inside the current locale.
const plug = ServerPlug("base/store-config", "shell/common");
export default async function Header() {
  const [config, s, $] = await plug.useR();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex h-18 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={$.getPath("/")} className="flex items-center gap-2">
              <Image src={RMachineLogo} alt="R-Machine Logo" className="size-8" priority />
              <span className="text-md font-semibold text-foreground">{config.storeName}</span>
            </Link>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href={$.getPath("/")} className="text-sm font-medium hover:underline">
              {s.nav.catalog}
            </Link>
            <Link href={$.getPath("/cart")} className="text-sm font-medium hover:underline">
              {s.nav.cart}
            </Link>
            <CartBadge />
            <LocaleSwitcher />
          </nav>
        </div>
      </div>
    </header>
  );
}
Header.plug = plug;
