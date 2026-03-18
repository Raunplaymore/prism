'use client'

const TOP_COUNTRIES = [
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
]

const HOT_ZONES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
]

// All free-access countries (used for login gate)
const ALL_FREE_COUNTRIES = [...TOP_COUNTRIES, ...HOT_ZONES]

interface NewsStandProps {
  selectedCountry: string | null
  onSelect: (code: string) => void
  isLoading: boolean
  onToggleMap?: () => void
  mapOpen?: boolean
}

export { TOP_COUNTRIES, HOT_ZONES, ALL_FREE_COUNTRIES }

function CountryButtons({
  countries,
  selectedCountry,
  onSelect,
  isLoading,
}: {
  countries: typeof TOP_COUNTRIES
  selectedCountry: string | null
  onSelect: (code: string) => void
  isLoading: boolean
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
      {countries.map(({ code, name, flag }) => (
        <button
          key={code}
          onClick={() => onSelect(code)}
          disabled={isLoading}
          className={`flex shrink-0 items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition ${
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
  )
}

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
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          {onToggleMap && (
            <button
              onClick={onToggleMap}
              className={`flex shrink-0 items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition ${
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
              className={`flex shrink-0 items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition ${
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
      <div>
        <h3 className="mb-2 text-xs font-medium text-red-400/70">Hot Zones</h3>
        <CountryButtons countries={HOT_ZONES} selectedCountry={selectedCountry} onSelect={onSelect} isLoading={isLoading} />
      </div>
    </div>
  )
}
