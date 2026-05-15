import { Plug } from "@/r-machine/toolset";
import { Button } from "../ui/button";

export const plug = Plug("outer/operator", "shell/landing-page");
export default function Exp2() {
  console.log("Exp2 render");
  const [operator, page] = plug.useR();
  return (
    <div>
      <div>
        {page.hero.cta.primary} : {operator.negative}
      </div>
      <Button onClick={operator.plus10}>Sum 10</Button>
    </div>
  );
}
