import { Button } from "@/components/ui/button";
import { VIEW_IDS } from "@/r-machine/outer/nav";
import { Plug } from "@/r-machine/toolset";

// The sidebar reads and writes a single OuterGear — this navigation IS a gear.
export const plug = Plug("outer/nav", "shell/showcase");
export function Sidebar() {
  const [nav, s] = plug.useR();

  return (
    <nav className="flex flex-col gap-1">
      {VIEW_IDS.map((id) => (
        <Button
          key={id}
          variant={nav.view === id ? "secondary" : "ghost"}
          className="justify-start"
          onClick={() => nav.setView(id)}
        >
          {s.nav[id]}
        </Button>
      ))}
    </nav>
  );
}
