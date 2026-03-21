'use client'

import { useState, useEffect } from 'react'
import { getAllCountries } from '@/lib/countries'
import { SUPPORTED_COUNTRIES } from '@/lib/rss'

const allCountries = getAllCountries().filter((c) => SUPPORTED_COUNTRIES.has(c.code))
const PINNED = ['US', 'GB', 'KR', 'JP', 'CN', 'DE', 'FR', 'IN', 'BR', 'SA']

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

interface TokenStats {
  totalPrompt: number
  totalCompletion: number
  totalCost: number
  calls: number
}

interface TokenLogEntry {
  time: string
  country: string
  method: string
  prompt: number
  completion: number
  cost: number
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<TokenStats | null>(null)
  const [tokenLog, setTokenLog] = useState<TokenLogEntry[]>([])
  const [logHasMore, setLogHasMore] = useState(false)
  const [logTotal, setLogTotal] = useState(0)
  const [logLoading, setLogLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user)
        if (data.user?.isAdmin) fetchStats()
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true))
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats?limit=20')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setTokenLog(data.log)
        setLogHasMore(data.logHasMore)
        setLogTotal(data.logTotal)
      }
    } catch {
      // ignore
    }
  }

  const loadMoreLog = async () => {
    setLogLoading(true)
    try {
      const res = await fetch(`/api/admin/stats?offset=${tokenLog.length}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setTokenLog((prev) => [...prev, ...data.log])
        setLogHasMore(data.logHasMore)
        setLogTotal(data.logTotal)
      }
    } catch {
      // ignore
    } finally {
      setLogLoading(false)
    }
  }

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString(), message, type },
      ...prev.slice(0, 49),
    ])
  }

  const refreshCache = async (code: string, skipStats = false) => {
    setLoading((prev) => ({ ...prev, [code]: true }))

    try {
      addLog(`Clearing cache for ${code}...`)
      const delRes = await fetch(`/api/admin/cache?country=${code}`, { method: 'DELETE' })
      const delData = await delRes.json()

      if (!delRes.ok) {
        addLog(`Failed to clear ${code}: ${delData.error}`, 'error')
        return
      }
      addLog(`${delData.message}`, 'success')

      // Step 1: Collect RSS
      addLog(`Collecting ${code}...`)
      const collectRes = await fetch(`/api/news/collect?country=${code}`, { method: 'POST' })
      const collectData = await collectRes.json()
      if (!collectRes.ok) {
        addLog(`${code}: collect failed — ${collectData.error || collectRes.status}`, 'error')
        return
      }
      addLog(`${code}: ${collectData.articlesCollected} articles collected`, 'info')

      // Step 2: Summarize
      addLog(`Summarizing ${code}...`)
      const sumRes = await fetch(`/api/news/collect?country=${code}&lang=ko&step=2`, { method: 'POST' })
      const sumData = await sumRes.json()
      if (sumRes.ok) {
        addLog(`${code}: ${sumData.newArticles} new / ${sumData.totalArticles} total`, 'success')
      } else {
        addLog(`${code}: summarize failed — ${sumData.error || sumRes.status}`, 'error')
      }

      if (!skipStats) fetchStats()
    } catch (err) {
      addLog(`Error refreshing ${code}: ${err}`, 'error')
    } finally {
      setLoading((prev) => ({ ...prev, [code]: false }))
    }
  }

  const refreshPinned = async () => {
    addLog('Refreshing all pinned countries (sequential)...')
    for (const code of PINNED) {
      await refreshCache(code, true)
    }
    fetchStats()
    addLog('All pinned countries refreshed', 'success')
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
          <h1 className="mb-4 text-xl font-bold">Prism Admin</h1>
          <p className="mb-6 text-sm text-gray-400">Sign in with an admin account to continue</p>
          <a
            href="/api/auth/login"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
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

  return (
    <div className="min-h-screen bg-gray-950 p-4 text-white sm:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Prism Admin</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <a href="/" className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 transition hover:text-white">
            Back to Map
          </a>
        </div>

        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <p className="text-[11px] text-gray-500">API Calls</p>
              <p className="text-lg font-bold">{stats.calls}</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <p className="text-[11px] text-gray-500">Input Tokens</p>
              <p className="text-lg font-bold">{(stats.totalPrompt / 1000).toFixed(1)}k</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <p className="text-[11px] text-gray-500">Output Tokens</p>
              <p className="text-lg font-bold">{(stats.totalCompletion / 1000).toFixed(1)}k</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <p className="text-[11px] text-gray-500">Total Cost</p>
              <p className="text-lg font-bold text-green-400">${stats.totalCost.toFixed(4)}</p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-400">Refresh Any Country</h2>
          <div className="flex items-center gap-3">
            <select
              id="country-select"
              className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm text-gray-300 outline-none transition focus:border-blue-500 sm:w-64"
            >
              <option value="">Select a country...</option>
              {allCountries.map(({ code, name }) => (
                <option key={code} value={code}>{name} ({code})</option>
              ))}
            </select>
            <button
              onClick={() => {
                const el = document.getElementById('country-select') as HTMLSelectElement
                if (el?.value) {
                  refreshCache(el.value)
                  addLog(`Started refresh for ${el.value}`, 'info')
                }
              }}
              className="shrink-0 rounded-lg bg-gray-800 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-gray-700 hover:text-white"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-400">Pinned Countries</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PINNED.map((code) => {
              const country = allCountries.find((c) => c.code === code)
              return (
                <div key={code} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
                  <div>
                    <span className="text-sm font-medium">{country?.name ?? code}</span>
                    <span className="ml-2 text-xs text-gray-500">{code}</span>
                  </div>
                  <button
                    onClick={() => refreshCache(code)}
                    disabled={loading[code]}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${loading[code] ? 'cursor-wait bg-gray-700 text-gray-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                  >
                    {loading[code] ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              )
            })}
          </div>
          <button
            onClick={() => {
              if (window.confirm(`Pinned ${PINNED.length}개국 전체를 리프래시합니다. 계속할까요?`)) {
                refreshPinned()
              }
            }}
            className="mt-3 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium transition hover:bg-blue-500"
          >
            Refresh All Pinned
          </button>
        </div>

        {tokenLog.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-gray-400">Token Usage Log <span className="text-gray-600">({tokenLog.length}/{logTotal})</span></h2>
            <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-left text-gray-500">
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Country</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2 text-right">In</th>
                    <th className="px-3 py-2 text-right">Out</th>
                    <th className="px-3 py-2 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenLog.map((entry, i) => (
                    <tr key={i} className="border-b border-gray-800/50">
                      <td className="px-3 py-1.5 text-gray-500">{new Date(entry.time).toLocaleTimeString()}</td>
                      <td className="px-3 py-1.5">{entry.country}</td>
                      <td className="px-3 py-1.5">
                        <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-[10px] text-green-400">Google News</span>
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-400">{entry.prompt.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-right text-gray-400">{entry.completion.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-right text-green-400">${entry.cost.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {logHasMore && (
              <button
                onClick={loadMoreLog}
                disabled={logLoading}
                className="mt-2 w-full rounded-lg border border-gray-800 bg-gray-900 py-2 text-xs text-gray-400 transition hover:border-gray-700 hover:text-white disabled:cursor-wait disabled:opacity-50"
              >
                {logLoading ? 'Loading...' : 'More'}
              </button>
            )}
          </div>
        )}

        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-400">Activity Log</h2>
          <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900 p-3">
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
