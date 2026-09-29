// First-load budget: the entry script plus everything index.html preloads.
// Fails CI when first load grows past the budget, or when a library that
// belongs to a single lazy page (charts, PDF, canvas capture) sneaks into it.
// Run after `npm run build`.
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import path from 'node:path'

const BUDGET_GZIP_KB = 285
const LAZY_ONLY = /charts|recharts|jspdf|html2canvas|canvg|purify/i

const dist = path.resolve(process.cwd(), 'dist')
const html = readFileSync(path.join(dist, 'index.html'), 'utf8')
// Read attributes independently of their order or quoting.
// Anchor on whitespace so data-src or data-type never match src or type.
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']?([^"'\\s>]+)`, 'i'))?.[1]
const entries = [...html.matchAll(/<script\b[^>]*>/gi)].map(([tag]) => tag)
  .filter((tag) => attr(tag, 'type') === 'module' && attr(tag, 'src')?.endsWith('.js'))
  .map((tag) => attr(tag, 'src'))
const preloads = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => tag)
  .filter((tag) => attr(tag, 'rel') === 'modulepreload' && attr(tag, 'href')?.endsWith('.js'))
  .map((tag) => attr(tag, 'href'))
if (!entries.length) {
  console.error('✗ no module entry script found in dist/index.html; the budget check cannot run')
  process.exit(1)
}
const files = [...entries, ...preloads]

let total = 0
const problems = []
for (const file of files) {
  const source = readFileSync(path.join(dist, file.replace(/^\//, '')))
  const kb = gzipSync(source).length / 1024
  total += kb
  console.log(`${kb.toFixed(1).padStart(7)} kB gzip  ${file}`)
  if (LAZY_ONLY.test(file)) problems.push(`${file} belongs to a lazy page but loads on every page`)
}
console.log(`${total.toFixed(1).padStart(7)} kB gzip  first-load total (budget ${BUDGET_GZIP_KB} kB)`)
if (total > BUDGET_GZIP_KB) problems.push(`first-load JavaScript is ${total.toFixed(1)} kB gzip, over the ${BUDGET_GZIP_KB} kB budget`)
if (problems.length) {
  for (const problem of problems) console.error(`✗ ${problem}`)
  process.exit(1)
}
console.log('✓ first-load bundle within budget')
