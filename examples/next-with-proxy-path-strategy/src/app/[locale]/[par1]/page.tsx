export default async function Page1({ params }: PageProps<"/[locale]/[par1]">) {
  const par1 = (await params).par1;

  return <div>[{par1}]</div>;
}
