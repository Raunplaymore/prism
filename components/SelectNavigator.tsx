'use client'

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  routePrefix: string // 예: '/keyword' → onChange 시 location.href = `/keyword/${value}`
  placeholder: string
}

/**
 * Thin <select> dropdown that navigates to `${routePrefix}/${value}` when an
 * option is picked. Used as a quick keyboard/screen-reader-friendly companion
 * to the visual sphere on /keyword and /category index pages.
 */
export default function SelectNavigator({ options, routePrefix, placeholder }: Props) {
  return (
    <div className="mb-8 mt-3">
      <label className="sr-only" htmlFor={`nav-${routePrefix}`}>
        {placeholder}
      </label>
      <select
        id={`nav-${routePrefix}`}
        defaultValue=""
        onChange={(e) => {
          const v = e.target.value
          if (!v) return
          window.location.href = `${routePrefix}/${encodeURIComponent(v)}`
        }}
        className="w-full appearance-none rounded-md border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 outline-none transition focus:border-blue-500"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
