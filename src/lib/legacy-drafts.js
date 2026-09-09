/** Remove only the old Vibe Check device drafts, leaving other apps untouched. */
export function clearLegacyDrafts(storage) {
  try {
    const target = storage || window.localStorage;
    const keys = Array.from({ length: target.length }, (_, index) => target.key(index));
    for (const key of keys) {
      if (key?.startsWith('vibe-check:check-in-draft:')) target.removeItem(key);
    }
  } catch {
    // Some browsers deny storage access. Account sign-out must still work.
  }
}
