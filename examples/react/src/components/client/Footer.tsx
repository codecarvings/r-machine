import type { Shell_Common } from "@/r-machine/shell/common/en";

// In this component the resources are passed from the layout to the footer
export default function Footer({ common }: { common: Shell_Common["footer"] }) {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="border-t border-gray-200 py-8">
          <p className="text-sm text-gray-500">{common.message}</p>
        </div>
      </div>
    </section>
  );
}
