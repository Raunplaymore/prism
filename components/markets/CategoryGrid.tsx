'use client'

import { useState } from 'react'
import HeatCell from './HeatCell'
import EventModal from './EventModal'
import type { EventCardItem } from './EventCard'

export default function CategoryGrid({ items }: { items: EventCardItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? items.find((i) => i.event.id === selectedId) : null

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-800 px-3 py-2 text-sm text-gray-600">
        매칭된 활성 이벤트 없음 (top 100 기준)
      </p>
    )
  }

  return (
    <>
      <div className="relative">
        <div
          className="flex snap-x gap-2 overflow-x-auto pb-3 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-gray-700"
        >
          {items.map((it) => (
            <div key={it.event.id} className="w-44 shrink-0 snap-start sm:w-56">
              <HeatCell item={it} onClick={() => setSelectedId(it.event.id)} />
            </div>
          ))}
          {/* trailing spacer so the last cell isn't flush with the edge */}
          <div className="w-1 shrink-0" aria-hidden="true" />
        </div>
        {/* Right-edge fade signals "more to scroll" */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-950 to-transparent" />
      </div>
      {selected && <EventModal item={selected} onClose={() => setSelectedId(null)} />}
    </>
  )
}
