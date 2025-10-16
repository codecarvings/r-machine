import { pickR } from "@/r-machine/server-tools";

export default async function ServerComp1() {
  const r = await pickR("common");
  return <h2>{r.title}</h2>;
}
