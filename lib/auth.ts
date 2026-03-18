// Edge-compatible JWT session using Web Crypto API (HMAC-SHA256)

export interface SessionUser {
  email: string
  name: string
  picture: string
  isAdmin: boolean
}

const ADMIN_EMAILS = ['sin2da@gmail.com']
const COOKIE_NAME = 'prism_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getSecret(): string {
  return process.env.ADMIN_SECRET || 'prism-default-secret'
}

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const payload = base64url(
    new TextEncoder().encode(
      JSON.stringify({
        ...user,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
      }),
    ),
  )
  const key = await getKey()
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${payload}`))
  return `${header}.${payload}.${base64url(sig)}`
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const [header, payload, sig] = token.split('.')
    if (!header || !payload || !sig) return null

    const key = await getKey()
    const sigBytes = base64urlDecode(sig)
    const dataBytes = new TextEncoder().encode(`${header}.${payload}`)
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes.buffer as ArrayBuffer,
      dataBytes,
    )
    if (!valid) return null

    const payloadBytes = base64urlDecode(payload)
    const data = JSON.parse(new TextDecoder().decode(payloadBytes))
    if (data.exp < Math.floor(Date.now() / 1000)) return null

    return { email: data.email, name: data.name, picture: data.picture, isAdmin: data.isAdmin }
  } catch {
    return null
  }
}

export function getSessionFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return match ? match[1] : null
}

export function sessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

export function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
