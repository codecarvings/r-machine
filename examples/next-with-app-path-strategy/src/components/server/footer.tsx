import { ServerPlug } from "@/r-machine/server-toolset";

const plug = ServerPlug("shell/common");
export default async function Footer() {
  const [s] = await plug.useR();

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="border-t border-gray-200 py-8">
          <p className="text-sm text-gray-500">{s.footer.message}</p>
        </div>
      </div>
    </section>
  );
}
Footer.plug = plug;
