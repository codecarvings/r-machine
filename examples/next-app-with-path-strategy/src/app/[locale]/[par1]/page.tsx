import { bindLocale } from "@/r-machine/server-tools";

export default async function Page1({ params }: PageProps<"/[locale]/[par1]">) {
  const locale = await bindLocale(params);
  const par1 = (await params).par1;

  return (
    <div>
      [{locale}] - [{par1}]
    </div>
  );
}
