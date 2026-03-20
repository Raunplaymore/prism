'use client'

interface MapControlsProps {
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

const btnClass = 'flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800/80 text-sm text-white backdrop-blur-sm transition hover:bg-gray-700'

export default function MapControls({ zoomIn, zoomOut, resetZoom }: MapControlsProps) {
  return (
    <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1">
      <button onClick={zoomIn} className={btnClass} aria-label="Zoom in">+</button>
      <button onClick={zoomOut} className={btnClass} aria-label="Zoom out">−</button>
      <button onClick={resetZoom} className={btnClass} aria-label="Reset view">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  )
}
