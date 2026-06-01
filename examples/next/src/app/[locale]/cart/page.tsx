import { CartView } from "@/components/client/CartView";

// Thin server shell around the client cart. `outer/cart` is client state, so the
// whole cart lives in <CartView>.
export default function CartPage() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <CartView />
      </div>
    </section>
  );
}
