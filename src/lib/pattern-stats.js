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

// Upper tail of the standard normal, from the complementary error function
// (Numerical Recipes erfcc; accurate to about 1e-7).
function erfc(x) {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806
    + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
export const normalUpper = (z) => 0.5 * erfc(z / Math.SQRT2);

/**
 * One-sided Cochran-Mantel-Haenszel test across strata of 2x2 tables
 * { a: with & state, b: with & no state, c: without & state, d: without & no state }.
 * Comparing within strata (here, days with a similar number of other tags)
 * keeps days when someone simply tagged more of everything from reading as a
 * connection.
 */
export function cmhGreater(strata) {
  let observed = 0;
  let expected = 0;
  let variance = 0;
  for (const { a, b, c, d } of strata) {
    const n = a + b + c + d;
    const withTotal = a + b;
    const withoutTotal = c + d;
    const stateTotal = a + c;
    const noStateTotal = b + d;
    if (n < 2 || !withTotal || !withoutTotal || !stateTotal || !noStateTotal) continue;
    observed += a;
    expected += (withTotal * stateTotal) / n;
    variance += (withTotal * withoutTotal * stateTotal * noStateTotal) / (n * n * (n - 1));
  }
  if (!variance) return 1;
  return normalUpper((observed - expected - 0.5) / Math.sqrt(variance));
}
