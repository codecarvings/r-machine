import { applyLocale, pickR } from "@/r-machine/server-tools";
import Comp1 from "@/server-components/comp1";

export default async function Home(props: PageProps<"/[locale]">) {
  applyLocale((await props.params).locale);
  const r = await pickR("common");

  return (
    <div>
      <h1 className="text-3xl font-bold underline">Hello, Next.js!</h1>
      <Comp1 />
      {r.currentLanguage}
    </div>
  );
}
