import ClientComp1 from "@/client-components/client-comp-1";
import ClientComp2 from "@/client-components/client-comp-2";
import { getLocale, pickR } from "@/r-machine/server-toolset";
import ServerComp1 from "@/server-components/server-comp-1";

export default async function Home({ params }: PageProps<"/[locale]">) {
  // const locale = await bindLocale(params);
  await params;
  const locale = await getLocale();
  console.log("--------- Home Page locale:", locale);

  const r = await pickR("common");

  return (
    <div>
      <h1 className="text-3xl font-bold underline">Hello, Next.js!</h1>
      <ServerComp1 />
      <ClientComp1 />
      <ClientComp2 />
      {r.currentLanguage}
    </div>
  );
}
