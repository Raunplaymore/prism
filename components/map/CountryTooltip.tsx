'use client'

interface CountryTooltipProps {
  name: string | null
  x: number
  y: number
}

export default function CountryTooltip({ name, x, y }: CountryTooltipProps) {
  if (!name) return null

  return (
    <div
      className="pointer-events-none fixed z-50 rounded bg-gray-800 px-3 py-1.5 text-sm text-white shadow-lg"
      style={{
        left: x + 12,
        top: y - 28,
      }}
    >
      {name}
    </div>
  )
}
