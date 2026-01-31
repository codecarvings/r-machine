import type { R_Common } from "@/r-machine/resources/common/en";

// In this component the resources are passed from the layout to the footer
export default function Footer({ r }: { r: R_Common["footer"] }) {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="border-t border-gray-200 py-8">
          <p className="text-sm text-gray-500">{r.message}</p>
        </div>
      </div>
    </section>
  );
}
