/** ISO alpha-2 code to country name mapping for API prompts */
const countryNames: Record<string, string> = {
  AF: 'Afghanistan', AL: 'Albania', DZ: 'Algeria', AR: 'Argentina',
  AU: 'Australia', AT: 'Austria', BD: 'Bangladesh', BE: 'Belgium',
  BR: 'Brazil', BG: 'Bulgaria', CA: 'Canada', CL: 'Chile',
  CN: 'China', CO: 'Colombia', HR: 'Croatia', CZ: 'Czech Republic',
  DK: 'Denmark', EG: 'Egypt', ET: 'Ethiopia', FI: 'Finland',
  FR: 'France', DE: 'Germany', GR: 'Greece', HU: 'Hungary',
  IN: 'India', ID: 'Indonesia', IR: 'Iran', IQ: 'Iraq',
  IE: 'Ireland', IL: 'Israel', IT: 'Italy', JP: 'Japan',
  KZ: 'Kazakhstan', KE: 'Kenya', KR: 'South Korea', KW: 'Kuwait',
  MY: 'Malaysia', MX: 'Mexico', MA: 'Morocco', MM: 'Myanmar',
  NL: 'Netherlands', NZ: 'New Zealand', NG: 'Nigeria', NO: 'Norway',
  PK: 'Pakistan', PE: 'Peru', PH: 'Philippines', PL: 'Poland',
  PT: 'Portugal', QA: 'Qatar', RO: 'Romania', RU: 'Russia',
  SA: 'Saudi Arabia', RS: 'Serbia', SG: 'Singapore', ZA: 'South Africa',
  ES: 'Spain', SE: 'Sweden', CH: 'Switzerland', TW: 'Taiwan',
  TH: 'Thailand', TR: 'Turkey', UA: 'Ukraine', AE: 'United Arab Emirates',
  GB: 'United Kingdom', US: 'United States', VN: 'Vietnam',
  KP: 'North Korea', VE: 'Venezuela', UZ: 'Uzbekistan', UY: 'Uruguay',
}

export function getCountryName(code: string): string {
  return countryNames[code.toUpperCase()] ?? code
}

export function getAllCountries(): { code: string; name: string }[] {
  return Object.entries(countryNames)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
