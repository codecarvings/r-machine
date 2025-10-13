type RMachineParams<K extends string> = {
  [P in K]: string;
};

interface ApplyLocale<K extends string> {
  (locale: string): Promise<string | undefined>;
  (params: Promise<RMachineParams<K>>): Promise<string | undefined>;
}

function createApplyLocale<K extends string>(): ApplyLocale<K> {
  return undefined!;
}

/*
export async function applyLocale(locale: string): Promise<string | undefined>;
export async function applyLocale<P extends Promise<RMachineParams>>(params: P): Promise<string | undefined>;
export async function applyLocale(localeOrParams: string | Promise<RMachineParams>): Promise<string | undefined> {
  if (typeof localeOrParams === "string") {
    return localeOrParams;
  }
  const params = await localeOrParams;
  return params.locale;
}
*/

const applyLocale = createApplyLocale<"locale">();

export default async function Page1(props: PageProps<"/[locale]/[par1]">) {
  await applyLocale(props.params);

  return <div>OK</div>;
}
