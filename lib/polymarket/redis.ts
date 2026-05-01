// Thin Upstash REST helpers shared by polymarket modules.
// Note: Cloudflare Workers fetch does NOT implement the standard `cache` field,
// so we omit it. In Next.js dev, Server Component fetch memoization can stash
// a stale NULL — but each call has a unique body (containing the key) so
// memoization keys differ in practice.

export async function redisGet(key: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['GET', key]),
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
    })
  } catch {
    // Cache write failures must not break the request
  }
}
