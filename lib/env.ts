/** Cloudflare Pages env identification.
 *
 *  CF Pages auto-injects CF_PAGES_BRANCH on every deployment — production
 *  builds get the production branch name (here: 'main'), preview builds
 *  get the source branch (typically 'dev' or feature/*).
 *
 *  We share Upstash Redis between production and preview, so this guard
 *  is what keeps preview deploys from running cost-bearing or
 *  cache-mutating actions against the live data. */
export function isProductionRuntime(): boolean {
  // CF Pages provides this. Local `next dev` doesn't, so default to true
  // there — local dev intentionally hits real Redis/OpenAI when developing.
  const branch = process.env.CF_PAGES_BRANCH
  if (!branch) return true
  return branch === 'main'
}

/** Standard 403 response for destructive endpoints when running on a
 *  preview deployment. Use at the top of any route handler that mutates
 *  the shared Redis cache or burns OpenAI tokens. */
export function previewBlockedResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Destructive action blocked on preview environment',
      hint: 'Run this on the production branch (main).',
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
