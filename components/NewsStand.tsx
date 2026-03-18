'use client'

import type { NewsCategory } from '@/types/news'

const TOP_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
]

interface NewsStandProps {
  selectedCountry: string | null
  onSelect: (code: string) => void
  isLoading: boolean
}

export { TOP_COUNTRIES }

export default function NewsStand({
  selectedCountry,
  onSelect,
  isLoading,
}: NewsStandProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
      {TOP_COUNTRIES.map(({ code, name, flag }) => (
        <button
          key={code}
          onClick={() => onSelect(code)}
          disabled={isLoading}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            selectedCountry === code
              ? 'border-blue-500 bg-blue-600/20 text-blue-400'
              : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-white'
          } ${isLoading ? 'cursor-wait opacity-60' : ''}`}
        >
          <span className="text-base">{flag}</span>
          <span className="hidden sm:inline">{name}</span>
          <span className="sm:hidden">{code}</span>
        </button>
      ))}
    </div>
  )
}
