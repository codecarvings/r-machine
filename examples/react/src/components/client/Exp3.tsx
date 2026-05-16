import { Plug } from "@/r-machine/toolset";

export const plug = Plug("outer/temp");
export default function Exp3() {
  const [temp] = plug.useR();
  return (
    <div>
      <div>{temp.value}</div>
    </div>
  );
}
