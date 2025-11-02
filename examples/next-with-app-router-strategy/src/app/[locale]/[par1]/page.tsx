import { bindLocale } from "@/r-machine/server-toolset";

export function generateStaticParams() {
  return [{ par1: "param1" }, { par1: "parameter1" }];
}

export default async function Page1({ params }: PageProps<"/[locale]/[par1]">) {
  const { locale, par1 } = await bindLocale(params);

  return (
    <div>
      [{locale}] - [{par1}]
    </div>
  );
}
