import { Plug } from "@/r-machine/toolset";
import { Button } from "../ui/button";

export const plug = Plug("outer/operator", "shell/exp");
export default function Exp2() {
  const [operator, shell] = plug.useR();
  return (
    <div>
      <div>{operator.negative}</div>
      <Button onClick={operator.plus10}>{shell.addButton}</Button>
    </div>
  );
}
