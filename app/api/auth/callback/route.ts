export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, sessionCookie, isAdmin } from '@/lib/auth'

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  token_type: string
}

interface GoogleUserInfo {
  email: string
  name: string
  picture: string
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/?error=oauth_not_configured', request.url))
  }

  const origin = request.nextUrl.origin
  const redirectUri = `${origin}/api/auth/callback`

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url))
    }

    const tokens: GoogleTokenResponse = await tokenRes.json()

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/?error=userinfo_failed', request.url))
    }

    const userInfo: GoogleUserInfo = await userRes.json()

    // Create session
    const sessionToken = await createSessionToken({
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      isAdmin: isAdmin(userInfo.email),
    })

    const response = NextResponse.redirect(new URL('/', request.url))
    response.headers.set('Set-Cookie', sessionCookie(sessionToken))
    return response
  } catch {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
