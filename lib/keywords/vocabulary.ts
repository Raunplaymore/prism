/**
 * Curated keyword vocabulary — canonical English slugs with aliases.
 *
 * Curation principle (decided 2026-04-30):
 *   Each slug must be evidenced by at least one article actually present
 *   in the live corpus (Redis feed cache). LLM keyword extraction over the
 *   live corpus is the ground truth for inclusion. Slugs that appear in
 *   reasoning but never surface in real article text are removed.
 *
 * Slug rules:
 *   - lowercase kebab-case ASCII
 *   - URL-safe (no spaces, no special chars except '-')
 */

export type KeywordCategory =
  | 'person'      // 인물 (정치인, 기업가)
  | 'country'     // 국가/지역
  | 'org'         // 정부·국제기구·정당
  | 'company'     // 기업
  | 'topic'       // 토픽/이슈
  | 'event'       // 사건/이벤트

export interface KeywordEntry {
  slug: string
  label: string
  labelKo?: string
  aliases: string[]
  category: KeywordCategory
}

export const VOCABULARY: KeywordEntry[] = [
  // ─── PEOPLE ──────────────────────────────────────────────────────
  { slug: 'trump',          label: 'Donald Trump',     labelKo: '트럼프',       category: 'person',  aliases: ['donald trump','trump','president trump','donald j trump','트럼프','도널드 트럼프'] },
  { slug: 'musk',           label: 'Elon Musk',        labelKo: '머스크',       category: 'person',  aliases: ['elon musk','musk','일론 머스크','머스크'] },
  { slug: 'netanyahu',      label: 'Benjamin Netanyahu', labelKo: '네타냐후',  category: 'person',  aliases: ['benjamin netanyahu','netanyahu','bibi','네타냐후'] },
  { slug: 'xi-jinping',     label: 'Xi Jinping',       labelKo: '시진핑',        category: 'person',  aliases: ['xi jinping','xi','president xi','시진핑'] },
  { slug: 'zelensky',       label: 'Volodymyr Zelensky', labelKo: '젤렌스키',  category: 'person',  aliases: ['volodymyr zelensky','zelensky','zelenskyy','젤렌스키'] },
  { slug: 'lula',           label: 'Lula da Silva',    labelKo: '룰라',         category: 'person',  aliases: ['lula','lula da silva','president lula','룰라'] },
  { slug: 'yoon-seok-youl', label: 'Yoon Suk Yeol',    labelKo: '윤석열',        category: 'person',  aliases: ['yoon suk yeol','yoon seok-youl','yoon seok youl','president yoon','윤석열','윤 석열'] },

  // ─── COUNTRIES / REGIONS ─────────────────────────────────────────
  { slug: 'us',             label: 'United States',    labelKo: '미국',         category: 'country', aliases: ['united states','united-states','usa','america','u.s.','us','미국'] },
  { slug: 'china',          label: 'China',            labelKo: '중국',         category: 'country', aliases: ['china','prc','chinese','중국'] },
  { slug: 'russia',         label: 'Russia',           labelKo: '러시아',       category: 'country', aliases: ['russia','russian','러시아'] },
  { slug: 'japan',          label: 'Japan',            labelKo: '일본',         category: 'country', aliases: ['japan','japanese','일본'] },
  { slug: 'korea',          label: 'South Korea',      labelKo: '한국',         category: 'country', aliases: ['south korea','south-korea','korea','rok','한국','대한민국'] },
  { slug: 'north-korea',    label: 'North Korea',      labelKo: '북한',         category: 'country', aliases: ['north korea','north-korea','dprk','north korean','북한'] },
  { slug: 'india',          label: 'India',            labelKo: '인도',         category: 'country', aliases: ['india','indian','인도'] },
  { slug: 'eu',             label: 'European Union',   labelKo: 'EU',          category: 'country', aliases: ['european union','eu','europe','유럽연합'] },
  { slug: 'uk',             label: 'United Kingdom',   labelKo: '영국',         category: 'country', aliases: ['united kingdom','uk','britain','british','영국'] },
  { slug: 'germany',        label: 'Germany',          labelKo: '독일',         category: 'country', aliases: ['germany','german','독일'] },
  { slug: 'france',         label: 'France',           labelKo: '프랑스',       category: 'country', aliases: ['france','french','프랑스'] },
  { slug: 'israel',         label: 'Israel',           labelKo: '이스라엘',      category: 'country', aliases: ['israel','israeli','이스라엘'] },
  { slug: 'iran',           label: 'Iran',             labelKo: '이란',         category: 'country', aliases: ['iran','iranian','이란'] },
  { slug: 'ukraine',        label: 'Ukraine',          labelKo: '우크라이나',   category: 'country', aliases: ['ukraine','ukrainian','우크라이나'] },
  { slug: 'taiwan',         label: 'Taiwan',           labelKo: '대만',         category: 'country', aliases: ['taiwan','taiwanese','roc','대만'] },
  { slug: 'gaza',           label: 'Gaza',             labelKo: '가자',         category: 'country', aliases: ['gaza','gaza strip','가자','가자지구'] },
  { slug: 'middle-east',    label: 'Middle East',      labelKo: '중동',         category: 'country', aliases: ['middle east','middle-east','중동'] },
  { slug: 'brazil',         label: 'Brazil',           labelKo: '브라질',       category: 'country', aliases: ['brazil','brazilian','브라질'] },
  { slug: 'lebanon',        label: 'Lebanon',          labelKo: '레바논',       category: 'country', aliases: ['lebanon','lebanese','레바논'] },
  { slug: 'pakistan',       label: 'Pakistan',         labelKo: '파키스탄',     category: 'country', aliases: ['pakistan','pakistani','파키스탄'] },
  { slug: 'poland',         label: 'Poland',           labelKo: '폴란드',       category: 'country', aliases: ['poland','polish','폴란드'] },
  { slug: 'canada',         label: 'Canada',           labelKo: '캐나다',       category: 'country', aliases: ['canada','canadian','캐나다'] },
  { slug: 'australia',      label: 'Australia',        labelKo: '호주',         category: 'country', aliases: ['australia','australian','호주','오스트레일리아'] },
  { slug: 'mexico',         label: 'Mexico',           labelKo: '멕시코',       category: 'country', aliases: ['mexico','mexican','멕시코'] },
  { slug: 'saudi-arabia',   label: 'Saudi Arabia',     labelKo: '사우디',       category: 'country', aliases: ['saudi arabia','saudi-arabia','saudi','ksa','사우디','사우디아라비아'] },
  { slug: 'uae',            label: 'UAE',              labelKo: '아랍에미리트', category: 'country', aliases: ['uae','united arab emirates','emirates','아랍에미리트','에미리트'] },
  { slug: 'mali',           label: 'Mali',             labelKo: '말리',         category: 'country', aliases: ['mali','말리'] },
  { slug: 'hormuz-strait',  label: 'Strait of Hormuz', labelKo: '호르무즈 해협', category: 'country', aliases: ['strait of hormuz','hormuz strait','hormuz-strait','hormuz','호르무즈 해협','호르무즈'] },

  // ─── ORGS — government / international / political party ─────────
  { slug: 'fed',            label: 'Federal Reserve',  labelKo: '연준',         category: 'org',     aliases: ['federal reserve','fed','the fed','frb','연준','미 연준'] },
  { slug: 'boj',            label: 'Bank of Japan',    labelKo: '일본은행',      category: 'org',     aliases: ['bank of japan','boj','일본은행'] },
  { slug: 'congress',       label: 'US Congress',      labelKo: '미 의회',      category: 'org',     aliases: ['congress','us congress','house of representatives','senate','미 의회','미국 의회'] },
  { slug: 'supreme-court',  label: 'Supreme Court',    labelKo: '연방대법원',   category: 'org',     aliases: ['supreme court','scotus','supreme-court','supreme-court-nominee','연방대법원','대법원'] },
  { slug: 'un',             label: 'United Nations',   labelKo: 'UN',          category: 'org',     aliases: ['united nations','un','유엔'] },
  { slug: 'nato',           label: 'NATO',             labelKo: 'NATO',        category: 'org',     aliases: ['nato','north atlantic treaty organization','나토'] },
  { slug: 'opec',           label: 'OPEC',             labelKo: 'OPEC',        category: 'org',     aliases: ['opec','opec+','석유수출국기구'] },
  { slug: 'bjp',            label: 'BJP',              labelKo: 'BJP',         category: 'org',     aliases: ['bjp','bharatiya janata party','인도 인민당'] },

  // ─── COMPANIES ───────────────────────────────────────────────────
  { slug: 'anthropic',      label: 'Anthropic',        labelKo: 'Anthropic',   category: 'company', aliases: ['anthropic','claude','앤트로픽'] },
  { slug: 'tesla',          label: 'Tesla',            labelKo: '테슬라',       category: 'company', aliases: ['tesla','tsla','테슬라'] },
  { slug: 'samsung',        label: 'Samsung',          labelKo: '삼성',         category: 'company', aliases: ['samsung','samsung electronics','삼성','삼성전자'] },

  // ─── TOPICS — economy / markets ──────────────────────────────────
  { slug: 'inflation',      label: 'Inflation',        labelKo: '인플레이션',   category: 'topic',   aliases: ['inflation','cpi','pce','인플레이션','물가'] },
  { slug: 'recession',      label: 'Recession',        labelKo: '경기침체',     category: 'topic',   aliases: ['recession','경기침체','불황'] },
  { slug: 'tariff',         label: 'Tariff',           labelKo: '관세',         category: 'topic',   aliases: ['tariff','tariffs','관세'] },
  { slug: 'sanctions',      label: 'Sanctions',        labelKo: '제재',         category: 'topic',   aliases: ['sanctions','sanction','제재'] },
  { slug: 'unemployment',   label: 'Unemployment',     labelKo: '실업',         category: 'topic',   aliases: ['unemployment','jobless','실업'] },
  { slug: 'gdp',            label: 'GDP',              labelKo: 'GDP',         category: 'topic',   aliases: ['gdp','gross domestic product','국내총생산'] },
  { slug: 'dollar',         label: 'US Dollar',        labelKo: '달러',         category: 'topic',   aliases: ['us dollar','dollar','dxy','달러'] },
  { slug: 'yen',            label: 'Japanese Yen',     labelKo: '엔화',         category: 'topic',   aliases: ['yen','japanese yen','jpy','엔','엔화'] },
  { slug: 'oil-price',      label: 'Oil Price',        labelKo: '유가',         category: 'topic',   aliases: ['oil price','oil prices','crude oil','wti','brent','유가','원유'] },

  // ─── TOPICS — geopolitics / conflict ─────────────────────────────
  { slug: 'ceasefire',      label: 'Ceasefire',        labelKo: '휴전',         category: 'topic',   aliases: ['ceasefire','truce','휴전'] },
  { slug: 'war',            label: 'War',              labelKo: '전쟁',         category: 'topic',   aliases: ['war','전쟁'] },
  { slug: 'iran-war',       label: 'Iran War',         labelKo: '이란 전쟁',     category: 'topic',   aliases: ['iran war','iran-war','iran-israel war','iran-us war','이란 전쟁'] },
  { slug: 'missile',        label: 'Missile',          labelKo: '미사일',       category: 'topic',   aliases: ['missile','missiles','ballistic missile','미사일'] },
  { slug: 'drone-strike',   label: 'Drone Strike',     labelKo: '드론 공격',    category: 'topic',   aliases: ['drone strike','drone attack','uav','드론 공격','드론'] },

  // ─── TOPICS — tech / society / health ────────────────────────────
  { slug: 'ai',             label: 'AI',               labelKo: 'AI',          category: 'topic',   aliases: ['ai','artificial intelligence','generative ai','genai','인공지능'] },
  { slug: 'semiconductor',  label: 'Semiconductor',    labelKo: '반도체',       category: 'topic',   aliases: ['semiconductor','chip','chips','반도체'] },
  { slug: 'humanoid-robots', label: 'Humanoid Robots', labelKo: '휴머노이드',   category: 'topic',   aliases: ['humanoid robot','humanoid robots','humanoid','휴머노이드'] },
  { slug: 'immigration',    label: 'Immigration',      labelKo: '이민',         category: 'topic',   aliases: ['immigration','migration','immigrant','이민'] },
  { slug: 'protest',        label: 'Protest',          labelKo: '시위',         category: 'topic',   aliases: ['protest','demonstration','시위'] },
  { slug: 'pandemic',       label: 'Pandemic',         labelKo: '팬데믹',       category: 'topic',   aliases: ['pandemic','covid','outbreak','팬데믹'] },
  { slug: 'voting-rights',  label: 'Voting Rights',    labelKo: '투표권',       category: 'topic',   aliases: ['voting rights','voter rights','투표권'] },
  { slug: 'exit-poll',      label: 'Exit Poll',        labelKo: '출구조사',     category: 'topic',   aliases: ['exit poll','exit polls','출구조사'] },

  // ─── EVENTS ──────────────────────────────────────────────────────
  { slug: 'world-cup',      label: 'World Cup',        labelKo: '월드컵',       category: 'event',   aliases: ['world cup','fifa world cup','월드컵'] },
]

let aliasIndex: Map<string, KeywordEntry> | null = null

export function getAliasIndex(): Map<string, KeywordEntry> {
  if (aliasIndex) return aliasIndex
  const map = new Map<string, KeywordEntry>()
  for (const entry of VOCABULARY) {
    for (const alias of entry.aliases) {
      const key = alias.trim().toLowerCase()
      if (key) map.set(key, entry)
    }
    map.set(entry.slug.toLowerCase(), entry)
  }
  aliasIndex = map
  return map
}

export function vocabularySize(): number {
  return VOCABULARY.length
}
