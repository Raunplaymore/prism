'use client'

import { useState, useEffect } from 'react'
import { getAllCountries } from '@/lib/countries'

const allCountries = getAllCountries()

// Quick access countries for grid display
const PINNED = ['US', 'GB', 'KR', 'JP', 'CN', 'DE', 'FR', 'IN', 'BR', 'SA']

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
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<TokenStats | null>(null)
  const [tokenLog, setTokenLog] = useState<TokenLogEntry[]>([])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data.stats)
      setTokenLog(data.log)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString(), message, type },
      ...prev.slice(0, 49),
    ])
  }

  const refreshCache = async (code: string, skipStats = false) => {
    setLoading((prev) => ({ ...prev, [code]: true }))

    try {
      // Step 1: Delete cache
      addLog(`Clearing cache for ${code}...`)
      const delRes = await fetch(`/api/admin/cache?country=${code}`, { method: 'DELETE' })
      const delData = await delRes.json()

      if (!delRes.ok) {
        addLog(`Failed to clear ${code}: ${delData.error}`, 'error')
        return
      }
      addLog(`${delData.message}`, 'success')

      // Step 2: Fetch fresh data (sequential to avoid race)
      for (const lang of ['en', 'ko']) {
        addLog(`Fetching ${code} (${lang})...`)
        const newsRes = await fetch(`/api/news?country=${code}&lang=${lang}`)
        const newsData = await newsRes.json()
        addLog(`${code}/${lang}: ${newsData.items?.length ?? 0} items cached`, 'success')
      }

      if (!skipStats) fetchStats()
    } catch (err) {
      addLog(`Error refreshing ${code}: ${err}`, 'error')
    } finally {
      setLoading((prev) => ({ ...prev, [code]: false }))
    }
  }

  const refreshPinned = async () => {
    addLog('Refreshing all pinned countries...')
    await Promise.all(PINNED.map((code) => refreshCache(code, true)))
    fetchStats()
    addLog('All pinned countries refreshed', 'success')
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 text-white sm:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Prism Admin</h1>
            <p className="text-sm text-gray-500">Cache & cost management</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/"
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400 transition hover:text-white"
            >
              Back to Map
            </a>
            <button
              onClick={refreshPinned}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium transition hover:bg-blue-500"
            >
              Refresh Pinned
            </button>
          </div>
        </div>

        {/* Token Usage Stats */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <p className="text-[11px] text-gray-500">API Calls</p>
              <p className="text-lg font-bold">{stats.calls}</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <p className="text-[11px] text-gray-500">Input Tokens</p>
              <p className="text-lg font-bold">{stats.totalPrompt.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <p className="text-[11px] text-gray-500">Output Tokens</p>
              <p className="text-lg font-bold">{stats.totalCompletion.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <p className="text-[11px] text-gray-500">Total Cost</p>
              <p className="text-lg font-bold text-green-400">${stats.totalCost.toFixed(4)}</p>
            </div>
          </div>
        )}

        {/* Refresh Any Country */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-400">Refresh Any Country</h2>
          <select
            onChange={(e) => {
              if (e.target.value) {
                refreshCache(e.target.value)
                e.target.value = ''
              }
            }}
            className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm text-gray-300 outline-none transition focus:border-blue-500 sm:w-64"
          >
            <option value="">Select a country...</option>
            {allCountries.map(({ code, name }) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        {/* Pinned Countries */}
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-400">Pinned Countries</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PINNED.map((code) => {
              const country = allCountries.find((c) => c.code === code)
              return (
                <div
                  key={code}
                  className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3"
                >
                  <div>
                    <span className="text-sm font-medium">{country?.name ?? code}</span>
                    <span className="ml-2 text-xs text-gray-500">{code}</span>
                  </div>
                  <button
                    onClick={() => refreshCache(code)}
                    disabled={loading[code]}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      loading[code]
                        ? 'cursor-wait bg-gray-700 text-gray-400'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {loading[code] ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Token Log */}
        {tokenLog.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-gray-400">Token Usage Log</h2>
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
                      <td className="px-3 py-1.5 text-gray-500">
                        {new Date(entry.time).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-1.5">{entry.country}</td>
                      <td className="px-3 py-1.5">
                        <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-[10px] text-green-400">
                          Google News
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-400">
                        {entry.prompt.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-400">
                        {entry.completion.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 text-right text-green-400">
                        ${entry.cost.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Log */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-400">Activity Log</h2>
          <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900 p-3">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-600">No activity yet</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="py-0.5 text-xs">
                  <span className="text-gray-600">{log.time}</span>{' '}
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-green-400'
                        : log.type === 'error'
                          ? 'text-red-400'
                          : 'text-gray-400'
                    }
                  >
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
