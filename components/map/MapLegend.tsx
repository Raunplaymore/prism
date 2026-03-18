'use client'

export default function MapLegend() {
  return (
    <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 rounded-lg bg-gray-800/80 px-4 py-2 backdrop-blur-sm">
      <span className="text-xs text-gray-400">Low</span>
      <div
        className="h-3 w-32 rounded-sm"
        style={{
          background: 'linear-gradient(to right, #dbeafe, #3b82f6, #1e3a5f)',
        }}
      />
      <span className="text-xs text-gray-400">High</span>
    </div>
  )
}
