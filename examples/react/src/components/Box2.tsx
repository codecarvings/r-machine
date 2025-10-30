import { useR } from "@/r-machine/toolset";

export default function Box2() {
  const r = useR("boxes/box_1_2");

  return (
    <div className="p-6 bg-stone-50 rounded-xl border border-slate-200">
      <div className="text-4xl mb-3">🎯</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{r.box2.title}</h3>
      <p className="text-sm text-gray-600">{r.box2.description}</p>
    </div>
  );
}
