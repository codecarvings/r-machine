import { pickR } from "@/r-machine/server-context";

export default async function Home() {
  const r = await pickR("common");

  return (
    <div>
      <h1 className="text-3xl font-bold underline">Hello, Next.js!</h1>
      <p>{r.title}</p>
    </div>
  );
}
