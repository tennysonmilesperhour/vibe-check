import { describe, expect, it } from "vitest";
import { clearAllLocalDrafts, clearCheckInDraft, loadCheckInDraft, saveCheckInDraft } from "../checkInDraft";

function memoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    key: (index) => [...values.keys()][index] ?? null,
  };
}

describe("check-in drafts", () => {
  it("keeps drafts isolated by user and date", () => {
    const storage = memoryStorage();
    saveCheckInDraft("user-a", "2026-09-04", { mood_score: 6 }, 2, storage);
    expect(loadCheckInDraft("user-a", "2026-09-04", storage)?.form.mood_score).toBe(6);
    expect(loadCheckInDraft("user-b", "2026-09-04", storage)).toBeNull();
  });

  it("clears one draft or all local drafts", () => {
    const storage = memoryStorage();
    saveCheckInDraft("user-a", "2026-09-04", { mood_score: 6 }, 2, storage);
    saveCheckInDraft("user-a", "2026-09-05", { mood_score: 7 }, 3, storage);
    storage.setItem("unrelated", "keep");
    clearCheckInDraft("user-a", "2026-09-04", storage);
    expect(loadCheckInDraft("user-a", "2026-09-04", storage)).toBeNull();
    clearAllLocalDrafts(storage);
    expect(storage.getItem("unrelated")).toBe("keep");
    expect(loadCheckInDraft("user-a", "2026-09-05", storage)).toBeNull();
  });
});
