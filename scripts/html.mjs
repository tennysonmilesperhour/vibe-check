// Reading the built index.html's tags, independently of attribute order or
// quoting. Anchored on whitespace, so data-src or data-type never match src or type.
export const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']?([^"'\\s>]+)`, 'i'))?.[1]
export const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(([tag]) => tag)
