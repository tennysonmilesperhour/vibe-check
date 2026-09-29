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
const files = [
  ...html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+\.js)"/g),
  ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+\.js)"/g),
].map((match) => match[1])

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
