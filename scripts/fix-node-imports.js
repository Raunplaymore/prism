/**
 * Post-build script: fix bare Node.js built-in imports for Cloudflare Workers compatibility.
 * Cloudflare requires `node:` prefix for built-in modules.
 */
const fs = require('fs')
const path = require('path')

const OUTPUT_DIR = path.join(__dirname, '..', '.vercel', 'output', 'static', '_worker.js')

const BUILTINS = [
  'async_hooks', 'buffer', 'crypto', 'events', 'http', 'https',
  'net', 'os', 'path', 'stream', 'url', 'util', 'zlib',
  'fs', 'child_process', 'worker_threads', 'perf_hooks',
  'string_decoder', 'querystring', 'tls', 'assert', 'timers',
]

const IMPORT_RE = new RegExp(
  `(from\\s*["'])(?!node:)(${BUILTINS.join('|')})(["'])`,
  'g'
)
const IMPORT_STAR_RE = new RegExp(
  `(import\\s*\\*\\s*as\\s+\\w+\\s+from\\s*["'])(?!node:)(${BUILTINS.join('|')})(["'])`,
  'g'
)
const IMPORT_DYN_RE = new RegExp(
  `(import\\s*\\(\\s*["'])(?!node:)(${BUILTINS.join('|')})(["']\\s*\\))`,
  'g'
)

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  content = content.replace(IMPORT_RE, '$1node:$2$3')
  content = content.replace(IMPORT_STAR_RE, '$1node:$2$3')
  content = content.replace(IMPORT_DYN_RE, '$1node:$2$3')

  if (content !== original) {
    fs.writeFileSync(filePath, content)
    console.log(`  Fixed: ${path.relative(OUTPUT_DIR, filePath)}`)
  }
}

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDir(full)
    } else if (entry.name.endsWith('.js')) {
      fixFile(full)
    }
  }
}

console.log('Fixing bare Node.js imports for Cloudflare compatibility...')
walkDir(OUTPUT_DIR)
console.log('Done.')
