/**
 * Why an export password cannot be used yet, or '' when it can. It cannot be
 * recovered, so it is typed twice: a typo would lock the file for good.
 * @param {string} password @param {string} repeat
 */
export function exportPasswordError(password, repeat) {
  if (password.length < 8) return 'Use an export password with at least eight characters.';
  if (password !== repeat) return 'The two passwords are different. Type the same password in both.';
  return '';
}

/** The export password, typed twice. */
export default function ExportPassword({ password, repeat, onPassword, onRepeat, note = '' }) {
  return <>
    <label className="living-label">Export password<input className="living-input mt-2" type="password" autoComplete="new-password" value={password} onChange={(e) => onPassword(e.target.value)} /><span className="living-muted text-xs">At least eight characters. It is not stored and cannot be recovered, and you will need it to open the file.{note && ` ${note}`}</span></label>
    <label className="living-label">Repeat the export password<input className="living-input mt-2" type="password" autoComplete="new-password" value={repeat} onChange={(e) => onRepeat(e.target.value)} /></label>
  </>;
}
