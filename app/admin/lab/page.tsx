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

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setAuthChecked(true))
  }, [])

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString(), message, type },
      ...prev.slice(0, 99),
    ])
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
    setSaving(true)
    addLog(`Saving to feed:GLOBAL_ECONOMY:${lang}...`)
    try {
      const res = await fetch(`/api/admin/lab/save?lang=${lang}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        addLog(`Save failed: ${data.error}`, 'error')
        return
      }
      addLog(`Saved ${data.count} articles to Redis`, 'success')
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

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4 text-white">
        <div className="text-center">
          <h1 className="mb-4 text-xl font-bold">Prism Lab</h1>
          <p className="mb-6 text-sm text-gray-400">Sign in with an admin account to continue</p>
          <a
            href="/api/auth/login"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
          >
            Sign in with Google
          </a>
        </div>
      </div>
    )
  }

  if (!user.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4 text-white">
        <div className="text-center">
          <h1 className="mb-4 text-xl font-bold">Access Denied</h1>
          <p className="mb-2 text-sm text-gray-400">{user.email} is not an admin account.</p>
          <a href="/" className="text-sm text-blue-400 hover:text-blue-300">Back to Map</a>
        </div>
      </div>
    )
  }

  const sentimentColor = (s: string) =>
    s === 'positive' ? 'text-green-400' : s === 'negative' ? 'text-red-400' : 'text-gray-400'

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
          <div className="flex gap-3">
            <button
              onClick={handleCollect}
              disabled={collecting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-50"
            >
              {collecting ? 'Collecting...' : 'Collect'}
            </button>
            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium transition hover:bg-purple-500 disabled:cursor-wait disabled:opacity-50"
            >
              {summarizing ? 'Summarizing...' : 'Summarize'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium transition hover:bg-green-500 disabled:cursor-wait disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Results area */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left: Raw articles */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-400">
              Raw Articles {rawArticles.length > 0 && <span className="text-gray-600">({rawArticles.length})</span>}
            </h2>
            <div className="max-h-96 space-y-2 overflow-y-auto">
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
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {summarized.length === 0 ? (
                <p className="text-xs text-gray-600">No summaries yet</p>
              ) : (
                summarized.map((a, i) => (
                  <div key={i} className="rounded border border-gray-800 bg-gray-950 p-2">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400">{a.category}</span>
                      <span className={`text-[10px] ${sentimentColor(a.sentiment)}`}>{a.sentiment}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-300">{a.title}</p>
                    <p className="mt-1 text-[10px] text-gray-500">{a.summary}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

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
