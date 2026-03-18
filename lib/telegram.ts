// Telegram Bot notification — edge-compatible (fetch only)

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return null
  return { token, chatId }
}

async function send(text: string): Promise<{ ok: boolean; error?: string }> {
  const config = getConfig()
  if (!config) return { ok: false, error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set' }

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    const data = await res.json() as { ok: boolean; description?: string }
    if (!data.ok) {
      console.error('Telegram send failed:', data.description)
      return { ok: false, error: data.description }
    }
    return { ok: true }
  } catch (err) {
    console.error('Telegram fetch error:', err)
    return { ok: false, error: String(err) }
  }
}

/** Test connectivity — returns Telegram API response for debugging */
export async function testSend(): Promise<{ ok: boolean; error?: string }> {
  return send('🟢 <b>Prism</b> — Telegram integration test')
}

// --- Cost alert ---
// Thresholds in USD — alerts at each level (once per level via Redis)
const COST_THRESHOLDS = [0.05, 0.10, 0.25, 0.50, 1.00, 2.00, 5.00]

export async function checkCostAlert(
  totalCost: number,
  calls: number,
  redisExec: (cmd: string[]) => Promise<unknown>,
): Promise<void> {
  for (const threshold of COST_THRESHOLDS) {
    if (totalCost >= threshold) {
      const key = `alert:cost:${threshold}`
      const already = await redisExec(['GET', key])
      if (!already) {
        await redisExec(['SET', key, '1', 'EX', '86400']) // 1 day dedup
        await send(
          `⚠️ <b>Cost Alert</b>\n` +
          `Total spend: <b>$${totalCost.toFixed(4)}</b> (${calls} calls)\n` +
          `Threshold: $${threshold.toFixed(2)}`,
        )
      }
    }
  }
}

// --- News cache updated ---
export async function notifyNewsCached(
  country: string,
  countryName: string,
  lang: string,
  itemCount: number,
): Promise<void> {
  await send(
    `📰 <b>${countryName}</b> (${country}/${lang})\n` +
    `${itemCount} articles cached`,
  )
}

// --- Error alert ---
export async function notifyError(
  context: string,
  error: unknown,
): Promise<void> {
  const msg = error instanceof Error ? error.message : String(error)
  await send(
    `🔴 <b>Error: ${context}</b>\n` +
    `<code>${msg.slice(0, 500)}</code>`,
  )
}
