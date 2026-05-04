import { redirect } from 'next/navigation'

export const runtime = 'edge'

interface Props {
  searchParams: { country?: string; article?: string; [k: string]: string | string[] | undefined }
}

export default function Home({ searchParams }: Props) {
  // Legacy share links: /?country=XX&article=YY were the home format before
  // / → /keyword redirect. Preserve them by routing to /map (the surface that
  // actually consumes country/article params via ClientHome).
  if (searchParams.country) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(searchParams)) {
      if (typeof v === 'string') qs.set(k, v)
    }
    redirect(`/map?${qs.toString()}`)
  }
  redirect('/keyword')
}
