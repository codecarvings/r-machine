import { bindLocale, pickR } from "@/r-machine/server-toolset";

export default async function Page1({ params }: PageProps<"/[locale]">) {
  await bindLocale(params);
  const r = await pickR("common");

  return (
    <div>
      <h1>SUB</h1>
      {r.title}
    </div>
  );
}
