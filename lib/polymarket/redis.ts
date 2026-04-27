// Thin Upstash REST helpers shared by polymarket modules.
// Server Component fetches must opt out of memoization with `cache: 'no-store'`,
// otherwise the first NULL response gets reused for all later GETs in the run.

export async function redisGet(key: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['GET', key]),
      cache: 'no-store',
    })
    const data = (await res.json()) as { result: string | null }
    return data.result
  } catch {
    return null
  }
}

export async function redisSetEx(key: string, value: string, ttlSec: number): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['SET', key, value, 'EX', String(ttlSec)]),
      cache: 'no-store',
    })
  } catch {
    // Cache write failures must not break the request
  }
}
