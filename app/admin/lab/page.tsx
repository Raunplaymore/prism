'use client'

import { useState, useEffect } from 'react'

interface User {
  email: string
  name: string
  picture: string
  isAdmin: boolean
}

interface LogEntry {
  time: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface RawArticle {
  title: string
  source: string
  link: string
  pubDate: string
}

interface SummarizedArticle {
  title: string
  summary: string
  detail: string
  category: string
  sentiment: string
  source: string
  url: string
}

interface HistoryEntry {
  index: number
  title: string
  query: string
  lang: string
  itemCount: number
  savedAt: string
}

const CATEGORY_PRESETS: Record<string, string> = {
  Macro: 'global economy macro GDP inflation interest rate',
  Stocks: 'stock market S&P 500 NASDAQ Dow Jones equity',
  Commodities: 'oil gold commodity crude WTI Brent copper',
  Forex: 'forex dollar euro yen won exchange rate currency',
  Crypto: 'bitcoin crypto ethereum blockchain cryptocurrency',
}

export default function LabPage() {
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [query, setQuery] = useState('global economy stock market')
  const [lang, setLang] = useState('ko')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [rawArticles, setRawArticles] = useState<RawArticle[]>([])
  const [summarized, setSummarized] = useState<SummarizedArticle[]>([])
  const [collecting, setCollecting] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [selectedHistory, setSelectedHistory] = useState<{ title: string; items: SummarizedArticle[] } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user)
        if (data.user?.isAdmin) fetchHistory()
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true))
  }, [])

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString(), message, type },
      ...prev.slice(0, 99),
    ])
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/admin/lab/save')
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
      }
    } catch { /* ignore */ }
  }

  const viewHistory = async (index: number) => {
    try {
      const res = await fetch(`/api/admin/lab/save?index=${index}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedHistory({ title: data.title, items: data.items || [] })
      }
    } catch { /* ignore */ }
  }

  const handleCollect = async () => {
    setCollecting(true)
    addLog(`Collecting RSS for: "${query}"`)
    try {
      const res = await fetch(`/api/admin/lab/collect?query=${encodeURIComponent(query)}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        addLog(`Collect failed: ${data.error}`, 'error')
        return
      }
      setRawArticles(data.articles || [])
      addLog(`Collected ${data.articlesCollected} articles`, 'success')
    } catch (err) {
      addLog(`Collect error: ${err}`, 'error')
    } finally {
      setCollecting(false)
    }
  }

  const handleSummarize = async () => {
    setSummarizing(true)
    addLog('Summarizing via pages.dev...')
    try {
      const res = await fetch(`https://prism-4gy.pages.dev/api/admin/lab/summarize?lang=${lang}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        addLog(`Summarize failed: ${data.error}`, 'error')
        return
      }
      setSummarized(data.items || [])
      addLog(`Summarized ${(data.items || []).length} articles`, 'success')
    } catch (err) {
      addLog(`Summarize error: ${err}`, 'error')
    } finally {
      setSummarizing(false)
    }
  }

  const handleSave = async () => {
    const title = saveTitle.trim() || `${query} (${new Date().toLocaleDateString('ko')})`
    setSaving(true)
    addLog(`Saving as "${title}"...`)
    try {
      const res = await fetch(`/api/admin/lab/save?title=${encodeURIComponent(title)}&query=${encodeURIComponent(query)}&lang=${lang}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        addLog(`Save failed: ${data.error}`, 'error')
        return
      }
      addLog(`Saved ${data.count} articles as "${title}"`, 'success')
      setSaveTitle('')
      fetchHistory()
    } catch (err) {
      addLog(`Save error: ${err}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!user?.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4 text-white">
        <div className="text-center">
          <h1 className="mb-4 text-xl font-bold">Access Denied</h1>
          <a href="/api/auth/login" className="text-sm text-blue-400 hover:text-blue-300">Sign in</a>
        </div>
      </div>
    )
  }

  const sentimentColor = (s: string) =>
    s === 'positive' ? 'text-green-400' : s === 'negative' ? 'text-red-400' : 'text-gray-400'

  // History detail view
  if (selectedHistory) {
    return (
      <div className="min-h-screen bg-gray-950 p-4 text-white sm:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-bold">{selectedHistory.title}</h1>
            <button
              onClick={() => setSelectedHistory(null)}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 transition hover:text-white"
            >
              Back to Lab
            </button>
          </div>
          <p className="mb-4 text-sm text-gray-500">{selectedHistory.items.length} articles</p>
          <div className="space-y-3">
            {selectedHistory.items.map((a, i) => (
              <div key={i} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">{a.category}</span>
                  <span className={`text-[10px] ${sentimentColor(a.sentiment)}`}>{a.sentiment}</span>
                  <span className="text-[10px] text-gray-600">{a.source}</span>
                </div>
                <h3 className="mb-1 text-sm font-medium text-white">{a.title}</h3>
                <p className="mb-2 text-xs text-gray-300">{a.summary}</p>
                <p className="text-xs leading-relaxed text-gray-500">{a.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 text-white sm:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Prism Lab</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <a href="/admin" className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 transition hover:text-white">
              Admin
            </a>
            <a href="/" className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 transition hover:text-white">
              Map
            </a>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">RSS Query</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Language</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="ko">Korean</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Category presets */}
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(CATEGORY_PRESETS).map(([label, q]) => (
              <button
                key={label}
                onClick={() => setQuery(q)}
                className={`rounded-md border px-3 py-1 text-xs transition ${
                  query === q
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCollect}
              disabled={collecting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-50"
            >
              {collecting ? 'Collecting...' : '1. Collect'}
            </button>
            <button
              onClick={handleSummarize}
              disabled={summarizing || rawArticles.length === 0}
              className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium transition hover:bg-purple-500 disabled:cursor-wait disabled:opacity-50"
            >
              {summarizing ? 'Summarizing...' : '2. Summarize'}
            </button>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="실험 제목..."
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-green-500"
              />
              <button
                onClick={handleSave}
                disabled={saving || summarized.length === 0}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium transition hover:bg-green-500 disabled:cursor-wait disabled:opacity-50"
              >
                {saving ? 'Saving...' : '3. Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Results area */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left: Raw articles */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-400">
              Raw Articles {rawArticles.length > 0 && <span className="text-gray-600">({rawArticles.length})</span>}
            </h2>
            <div className="max-h-[500px] space-y-2 overflow-y-auto">
              {rawArticles.length === 0 ? (
                <p className="text-xs text-gray-600">No articles collected yet</p>
              ) : (
                rawArticles.map((a, i) => (
                  <div key={i} className="rounded border border-gray-800 bg-gray-950 p-2">
                    <p className="text-xs font-medium text-gray-300">{a.title}</p>
                    <p className="mt-1 text-[10px] text-gray-500">{a.source}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Summarized articles */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-400">
              Summarized {summarized.length > 0 && <span className="text-gray-600">({summarized.length})</span>}
            </h2>
            <div className="max-h-[500px] space-y-2 overflow-y-auto">
              {summarized.length === 0 ? (
                <p className="text-xs text-gray-600">No summaries yet</p>
              ) : (
                summarized.map((a, i) => (
                  <div key={i} className="rounded border border-gray-800 bg-gray-950 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400">{a.category}</span>
                      <span className={`text-[10px] ${sentimentColor(a.sentiment)}`}>{a.sentiment}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-200">{a.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{a.summary}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-gray-400">History</h2>
            <div className="space-y-2">
              {history.map((h) => (
                <button
                  key={h.index}
                  onClick={() => viewHistory(h.index)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-left transition hover:border-gray-700"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-200">{h.title}</p>
                    <p className="text-[10px] text-gray-500">{h.query} · {h.lang} · {h.itemCount} articles</p>
                  </div>
                  <span className="text-[10px] text-gray-600">{new Date(h.savedAt).toLocaleString('ko')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Activity log */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-400">Activity Log</h2>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900 p-3">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-600">No activity yet</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="py-0.5 text-xs">
                  <span className="text-gray-600">{log.time}</span>{' '}
                  <span className={log.type === 'success' ? 'text-green-400' : log.type === 'error' ? 'text-red-400' : 'text-gray-400'}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
