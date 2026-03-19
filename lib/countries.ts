/** ISO alpha-2 code to country name mapping for API prompts */
const countryNames: Record<string, string> = {
  AF: 'Afghanistan', AL: 'Albania', DZ: 'Algeria', AO: 'Angola',
  AR: 'Argentina', AM: 'Armenia', AU: 'Australia', AT: 'Austria',
  AZ: 'Azerbaijan', BH: 'Bahrain', BD: 'Bangladesh', BY: 'Belarus',
  BE: 'Belgium', BJ: 'Benin', BT: 'Bhutan', BO: 'Bolivia',
  BA: 'Bosnia and Herzegovina', BW: 'Botswana', BR: 'Brazil', BN: 'Brunei',
  BG: 'Bulgaria', BF: 'Burkina Faso', BI: 'Burundi', KH: 'Cambodia',
  CM: 'Cameroon', CA: 'Canada', CF: 'Central African Republic', TD: 'Chad',
  CL: 'Chile', CN: 'China', CO: 'Colombia', CD: 'DR Congo',
  CG: 'Republic of Congo', CR: 'Costa Rica', CI: 'Ivory Coast', HR: 'Croatia',
  CU: 'Cuba', CY: 'Cyprus', CZ: 'Czech Republic', DK: 'Denmark',
  DJ: 'Djibouti', DO: 'Dominican Republic', EC: 'Ecuador', EG: 'Egypt',
  SV: 'El Salvador', GQ: 'Equatorial Guinea', ER: 'Eritrea', EE: 'Estonia',
  SZ: 'Eswatini', ET: 'Ethiopia', FI: 'Finland', FR: 'France',
  GA: 'Gabon', GM: 'Gambia', GE: 'Georgia', DE: 'Germany',
  GH: 'Ghana', GR: 'Greece', GT: 'Guatemala', GN: 'Guinea',
  GW: 'Guinea-Bissau', GY: 'Guyana', HT: 'Haiti', HN: 'Honduras',
  HU: 'Hungary', IS: 'Iceland', IN: 'India', ID: 'Indonesia',
  IR: 'Iran', IQ: 'Iraq', IE: 'Ireland', IL: 'Israel',
  IT: 'Italy', JM: 'Jamaica', JP: 'Japan', JO: 'Jordan',
  KZ: 'Kazakhstan', KE: 'Kenya', KR: 'South Korea', KW: 'Kuwait',
  KG: 'Kyrgyzstan', LA: 'Laos', LV: 'Latvia', LB: 'Lebanon',
  LS: 'Lesotho', LR: 'Liberia', LY: 'Libya', LT: 'Lithuania',
  LU: 'Luxembourg', MG: 'Madagascar', MW: 'Malawi', MY: 'Malaysia',
  ML: 'Mali', MR: 'Mauritania', MX: 'Mexico', MD: 'Moldova',
  MN: 'Mongolia', ME: 'Montenegro', MA: 'Morocco', MZ: 'Mozambique',
  MM: 'Myanmar', NA: 'Namibia', NP: 'Nepal', NL: 'Netherlands',
  NZ: 'New Zealand', NI: 'Nicaragua', NE: 'Niger', NG: 'Nigeria',
  KP: 'North Korea', MK: 'North Macedonia', NO: 'Norway', OM: 'Oman',
  PK: 'Pakistan', PA: 'Panama', PG: 'Papua New Guinea', PY: 'Paraguay',
  PE: 'Peru', PH: 'Philippines', PL: 'Poland', PT: 'Portugal',
  QA: 'Qatar', RO: 'Romania', RU: 'Russia', RW: 'Rwanda',
  SA: 'Saudi Arabia', SN: 'Senegal', RS: 'Serbia', SL: 'Sierra Leone',
  SG: 'Singapore', SK: 'Slovakia', SI: 'Slovenia', SO: 'Somalia',
  ZA: 'South Africa', SS: 'South Sudan', ES: 'Spain', LK: 'Sri Lanka',
  SD: 'Sudan', SR: 'Suriname', SE: 'Sweden', CH: 'Switzerland',
  SY: 'Syria', TW: 'Taiwan', TJ: 'Tajikistan', TZ: 'Tanzania',
  TH: 'Thailand', TL: 'Timor-Leste', TG: 'Togo', TN: 'Tunisia',
  TR: 'Turkey', TM: 'Turkmenistan', UG: 'Uganda', UA: 'Ukraine',
  AE: 'United Arab Emirates', GB: 'United Kingdom', US: 'United States',
  UY: 'Uruguay', UZ: 'Uzbekistan', VE: 'Venezuela', VN: 'Vietnam',
  YE: 'Yemen', ZM: 'Zambia', ZW: 'Zimbabwe',
}

/** Korean country names for search */
const countryNamesKo: Record<string, string> = {
  AF: '아프가니스탄', AL: '알바니아', DZ: '알제리', AO: '앙골라',
  AR: '아르헨티나', AM: '아르메니아', AU: '호주', AT: '오스트리아',
  AZ: '아제르바이잔', BH: '바레인', BD: '방글라데시', BY: '벨라루스',
  BE: '벨기에', BJ: '베냉', BT: '부탄', BO: '볼리비아',
  BA: '보스니아', BW: '보츠와나', BR: '브라질', BN: '브루나이',
  BG: '불가리아', BF: '부르키나파소', BI: '부룬디', KH: '캄보디아',
  CM: '카메룬', CA: '캐나다', CF: '중앙아프리카', TD: '차드',
  CL: '칠레', CN: '중국', CO: '콜롬비아', CD: '콩고민주공화국',
  CG: '콩고공화국', CR: '코스타리카', CI: '코트디부아르', HR: '크로아티아',
  CU: '쿠바', CY: '키프로스', CZ: '체코', DK: '덴마크',
  DJ: '지부티', DO: '도미니카공화국', EC: '에콰도르', EG: '이집트',
  SV: '엘살바도르', GQ: '적도기니', ER: '에리트레아', EE: '에스토니아',
  SZ: '에스와티니', ET: '에티오피아', FI: '핀란드', FR: '프랑스',
  GA: '가봉', GM: '감비아', GE: '조지아', DE: '독일',
  GH: '가나', GR: '그리스', GT: '과테말라', GN: '기니',
  GW: '기니비사우', GY: '가이아나', HT: '아이티', HN: '온두라스',
  HU: '헝가리', IS: '아이슬란드', IN: '인도', ID: '인도네시아',
  IR: '이란', IQ: '이라크', IE: '아일랜드', IL: '이스라엘',
  IT: '이탈리아', JM: '자메이카', JP: '일본', JO: '요르단',
  KZ: '카자흐스탄', KE: '케냐', KR: '한국', KW: '쿠웨이트',
  KG: '키르기스스탄', LA: '라오스', LV: '라트비아', LB: '레바논',
  LS: '레소토', LR: '라이베리아', LY: '리비아', LT: '리투아니아',
  LU: '룩셈부르크', MG: '마다가스카르', MW: '말라위', MY: '말레이시아',
  ML: '말리', MR: '모리타니', MX: '멕시코', MD: '몰도바',
  MN: '몽골', ME: '몬테네그로', MA: '모로코', MZ: '모잠비크',
  MM: '미얀마', NA: '나미비아', NP: '네팔', NL: '네덜란드',
  NZ: '뉴질랜드', NI: '니카라과', NE: '니제르', NG: '나이지리아',
  KP: '북한', MK: '북마케도니아', NO: '노르웨이', OM: '오만',
  PK: '파키스탄', PA: '파나마', PG: '파푸아뉴기니', PY: '파라과이',
  PE: '페루', PH: '필리핀', PL: '폴란드', PT: '포르투갈',
  QA: '카타르', RO: '루마니아', RU: '러시아', RW: '르완다',
  SA: '사우디아라비아', SN: '세네갈', RS: '세르비아', SL: '시에라리온',
  SG: '싱가포르', SK: '슬로바키아', SI: '슬로베니아', SO: '소말리아',
  ZA: '남아프리카공화국', SS: '남수단', ES: '스페인', LK: '스리랑카',
  SD: '수단', SR: '수리남', SE: '스웨덴', CH: '스위스',
  SY: '시리아', TW: '대만', TJ: '타지키스탄', TZ: '탄자니아',
  TH: '태국', TL: '동티모르', TG: '토고', TN: '튀니지',
  TR: '튀르키예', TM: '투르크메니스탄', UG: '우간다', UA: '우크라이나',
  AE: '아랍에미리트', GB: '영국', US: '미국',
  UY: '우루과이', UZ: '우즈베키스탄', VE: '베네수엘라', VN: '베트남',
  YE: '예멘', ZM: '잠비아', ZW: '짐바브웨',
}

export function getCountryName(code: string): string {
  return countryNames[code.toUpperCase()] ?? code
}

export function getCountryNameKo(code: string): string {
  return countryNamesKo[code.toUpperCase()] ?? countryNames[code.toUpperCase()] ?? code
}

export function getAllCountries(): { code: string; name: string; nameKo: string }[] {
  return Object.entries(countryNames)
    .map(([code, name]) => ({ code, name, nameKo: countryNamesKo[code] ?? name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
