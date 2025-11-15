import RMachineIcon from "@/components/gfx/r-machine.icon.svg";
import { LocaleSwitcher } from "./LocaleSwitcher";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex h-18 items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={RMachineIcon} alt="R-Machine Logo" className="size-8" />
            <span className="text-md font-medium text-foreground">R-Machine ⧹ Examples ⧹ React</span>
          </div>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
