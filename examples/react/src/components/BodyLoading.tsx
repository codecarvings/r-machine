export default function BodyLoading() {
  return (
    <div className="min-h-screen bg-linear-to-tr from-stone-600 to-stone-800 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-stone-300 border-t-white animate-spin" />

          {/* Inner pulsing circle */}
          <div className="absolute inset-3 rounded-full bg-white animate-pulse" />

          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-stone-600 rounded-full" />
          </div>
        </div>

        <p className="text-white text-xl font-medium animate-pulse">Loading content...</p>
      </div>
    </div>
  );
}
