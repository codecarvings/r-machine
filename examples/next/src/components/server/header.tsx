import Image from "next/image";
import Link from "next/link";
import { LocaleSwitcher } from "@/components/client/locale-switcher";
import RMachineLogo from "@/gfx/r-machine.logo.svg";
import { ServerPlug } from "@/r-machine/server-toolset";

export const plug = ServerPlug();
export default async function Header() {
  const { $ } = await plug.useR();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex h-18 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={$.getPath("/")}>
              <Image src={RMachineLogo} alt="R-Machine Logo" className="size-8" priority />
            </Link>
            <span className="text-md font-medium text-foreground">R-Machine ⧹ Examples ⧹ Next App</span>
          </div>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
