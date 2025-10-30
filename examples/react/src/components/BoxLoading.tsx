export default function BoxLoading() {
  return (
    <div className="p-6 bg-stone-50 rounded-xl border border-slate-200 animate-pulse flex flex-col items-center">
      <div className="w-10 h-10 bg-gray-200 rounded mb-3" />
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="space-y-2 w-full flex flex-col items-center">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}
