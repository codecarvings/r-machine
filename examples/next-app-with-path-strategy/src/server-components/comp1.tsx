import { pickR } from "@/r-machine/server-tools";

export default async function Comp1() {
  const r = await pickR("common");
  return <h2>{r.title}</h2>;
}
