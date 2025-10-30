import { useR } from "@/r-machine/toolset";

export default function Box1() {
  const r = useR("boxes/box_1_2"); // Fetch R-Machine content

  return (
    <div className="p-6 bg-stone-50 rounded-xl border border-slate-200">
      <div className="text-4xl mb-3">🚀</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{r.box1.title}</h3>
      <p className="text-sm text-gray-600">{r.box1.description}</p>
    </div>
  );
}
