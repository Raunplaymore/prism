'use client'

// Quick Access — 권역 + 사용 빈도 순 (KR 먼저, 미국·동아시아·유럽·분쟁·기타).
const TOP_COUNTRIES = [
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
]

interface NewsStandProps {
  selectedCountry: string | null
  onSelect: (code: string) => void
  isLoading: boolean
  onToggleMap?: () => void
  mapOpen?: boolean
}

export { TOP_COUNTRIES }

export default function NewsStand({
  selectedCountry,
  onSelect,
  isLoading,
  onToggleMap,
  mapOpen,
}: NewsStandProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="mb-2 text-xs font-medium text-gray-500">Quick Access</h3>
        <div className="flex flex-wrap gap-1.5 pb-1">
          {onToggleMap && (
            <button
              onClick={onToggleMap}
              className={`flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm font-medium transition ${
                mapOpen
                  ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                  : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span className="hidden sm:inline">Map</span>
            </button>
          )}
          {TOP_COUNTRIES.map(({ code, name, flag }) => (
            <button
              key={code}
              onClick={() => onSelect(code)}
              disabled={isLoading}
              className={`flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm font-medium transition ${
                selectedCountry === code
                  ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                  : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-white'
              } ${isLoading ? 'cursor-wait opacity-60' : ''}`}
            >
              <span className="text-sm">{flag}</span>
              <span className="hidden sm:inline">{name}</span>
              <span className="sm:hidden">{code}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
