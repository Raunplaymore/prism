/** Read SNS handles from server-side env and build canonical URLs.
 *  Both keys are optional — if a value is missing, the link should
 *  be hidden in UI and omitted from JSON-LD sameAs. */
function nonEmpty(v: string | undefined): string | null {
  const s = v?.trim()
  return s && s.length > 0 ? s : null
}

const igHandle = nonEmpty(process.env.INSTAGRAM_PRISM)
const threadsHandle = nonEmpty(process.env.THREADS_PRISM)

export const SOCIAL_LINKS: { instagram: string | null; threads: string | null } = {
  instagram: igHandle ? `https://www.instagram.com/${igHandle}` : null,
  threads: threadsHandle ? `https://www.threads.com/@${threadsHandle}` : null,
}

/** sameAs 배열용 — null 제거 후 string[]만 반환. */
export function socialSameAs(): string[] {
  return [SOCIAL_LINKS.instagram, SOCIAL_LINKS.threads].filter(
    (x): x is string => Boolean(x),
  )
}
