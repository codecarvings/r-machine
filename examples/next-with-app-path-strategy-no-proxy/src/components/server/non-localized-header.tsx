import Image from "next/image";
import Link from "next/link";
import RMachineIcon from "@/components/gfx/r-machine.icon.svg";

export default function NonLocalizedHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex h-18 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Image src={RMachineIcon} alt="R-Machine Logo" className="size-8" />
            </Link>
            <span className="text-md font-medium text-foreground">
              R-Machine ⧹ Examples ⧹ Next App ⧹ Path Strategy (no proxy)
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
