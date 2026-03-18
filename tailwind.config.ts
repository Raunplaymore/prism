import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'heat-low': '#dbeafe',
        'heat-mid': '#3b82f6',
        'heat-high': '#1e3a5f',
        'sentiment-positive': '#22c55e',
        'sentiment-neutral': '#6b7280',
        'sentiment-negative': '#ef4444',
      },
    },
  },
  plugins: [],
}
export default config
