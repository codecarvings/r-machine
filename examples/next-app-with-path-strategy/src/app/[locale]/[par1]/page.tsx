export default async function Page1({ params }: { params: Promise<{ locale: string; par1: string }> }) {
  const locale = (await params).locale;
  const par1 = (await params).par1;

  return (
    <div>
      [{locale}] - [{par1}]
    </div>
  );
}
