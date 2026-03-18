'use client'

interface MapControlsProps {
  zoomIn: () => void
  zoomOut: () => void
}

export default function MapControls({ zoomIn, zoomOut }: MapControlsProps) {
  return (
    <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
      <button
        onClick={zoomIn}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800/80 text-lg text-white backdrop-blur-sm transition hover:bg-gray-700"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={zoomOut}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800/80 text-lg text-white backdrop-blur-sm transition hover:bg-gray-700"
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  )
}
