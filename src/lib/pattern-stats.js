// Small, exact statistics for "does this show up more often with X?".
// Counts are days, so the numbers are small and an exact test is cheap.

const logFactorials = [0];
function logFactorial(n) {
  for (let i = logFactorials.length; i <= n; i += 1) logFactorials[i] = logFactorials[i - 1] + Math.log(i);
  return logFactorials[n];
}
const logChoose = (n, k) => logFactorial(n) - logFactorial(k) - logFactorial(n - k);

/**
 * One-sided Fisher exact test: the chance of seeing `hits` or more of the
 * `withTotal` days with the thing, if the state were spread across all days
 * at random. `otherHits` of `withoutTotal` days without it had the state.
 */
export function fisherGreater(hits, withTotal, otherHits, withoutTotal) {
  const total = withTotal + withoutTotal;
  const stateDays = hits + otherHits;
  const all = logChoose(total, stateDays);
  let p = 0;
  for (let x = hits; x <= Math.min(stateDays, withTotal); x += 1) {
    p += Math.exp(logChoose(withTotal, x) + logChoose(withoutTotal, stateDays - x) - all);
  }
  return Math.min(1, p);
}
