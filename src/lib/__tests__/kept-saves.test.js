import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearKeptSaves, dropSave, holdKeptSaves, isConnectionError, keepSave, keptSaves, needsChoice, sendAgain } from '../kept-saves';
import { changedElsewhere, holdsSave, isRefusal, sendKeptSaves, writtenHere } from '../send-kept-saves';

/** A device's storage, in memory. */
function memory() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, String(value)); }, removeItem: (key) => { values.delete(key); }, values };
}
const offline = () => Object.assign(new TypeError('Failed to fetch'), {});
let tick = 0;
const now = () => `2026-10-03T00:00:${String((tick += 1) % 60).padStart(2, '0')}.000Z`;

describe('kept saves', () => {
  it('keeps saves per person, oldest first', () => {
    const storage = memory();
    keepSave('a', { id: 'check-in:2026-10-02', kind: 'check-in', payload: { date: '2026-10-02', mood_score: 6 } }, { storage, now });
    keepSave('a', { id: 'entry-1', kind: 'journal', payload: { notes: 'first frost' } }, { storage, now });
    keepSave('b', { id: 'entry-2', kind: 'journal', payload: { notes: 'not mine' } }, { storage, now });
    expect(keptSaves('a', storage).map((save) => save.id)).toEqual(['check-in:2026-10-02', 'entry-1']);
    expect(keptSaves('b', storage).map((save) => save.id)).toEqual(['entry-2']);
  });

  it('replaces an earlier save for the same day or entry, as the account keeps the latest', () => {
    const storage = memory();
    keepSave('a', { id: 'check-in:2026-10-02', kind: 'check-in', payload: { date: '2026-10-02', mood_score: 3 } }, { storage, now });
    keepSave('a', { id: 'entry-1', kind: 'journal', payload: { notes: 'a' } }, { storage, now });
    keepSave('a', { id: 'check-in:2026-10-02', kind: 'check-in', payload: { date: '2026-10-02', mood_score: 7 } }, { storage, now });
    expect(keptSaves('a', storage).map((save) => [save.id, save.payload.mood_score ?? save.payload.notes])).toEqual([['entry-1', 'a'], ['check-in:2026-10-02', 7]]);
  });

  it('says when it could not keep a save', () => {
    const full = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); }, removeItem: () => {} };
    expect(keepSave('a', { id: 'entry-1', kind: 'journal', payload: {} }, { storage: full, now })).toBe(false);
    expect(keepSave(null, { id: 'entry-1', kind: 'journal', payload: {} }, { storage: memory(), now })).toBe(false);
  });

  it('drops one save, or all of a person\'s', () => {
    const storage = memory();
    keepSave('a', { id: 'entry-1', kind: 'journal', payload: {} }, { storage, now });
    keepSave('a', { id: 'entry-2', kind: 'journal', payload: {} }, { storage, now });
    dropSave('a', 'entry-1', storage);
    expect(keptSaves('a', storage).map((save) => save.id)).toEqual(['entry-2']);
    clearKeptSaves('a', storage);
    expect(keptSaves('a', storage)).toEqual([]);
    expect(storage.values.size).toBe(0);
  });

  it('reads nothing from storage it cannot parse', () => {
    const storage = memory();
    storage.setItem('vibe:kept-saves:a', 'not json');
    expect(keptSaves('a', storage)).toEqual([]);
  });

  it('tells a lost connection from a refusal', () => {
    expect(isConnectionError(offline())).toBe(true);
    expect(isConnectionError({ message: 'TypeError: Failed to fetch', code: '' })).toBe(true);
    expect(isConnectionError({ message: 'TypeError: NetworkError when attempting to fetch resource.' })).toBe(true);
    expect(isConnectionError({ message: 'TypeError: Load failed' })).toBe(true);
    expect(isConnectionError({ name: 'AuthRetryableFetchError', message: '' })).toBe(true);
    expect(isConnectionError({ message: 'new row violates row-level security policy', code: '42501' })).toBe(false);
  });

  it('sends saves in order and removes each once sent', async () => {
    const storage = memory();
    keepSave('a', { id: 'entry-1', kind: 'journal', payload: { notes: 'one' } }, { storage, now });
    keepSave('a', { id: 'entry-2', kind: 'journal', payload: { notes: 'two' } }, { storage, now });
    const sent = [];
    expect(await sendKeptSaves('a', async (save) => { sent.push(save.id); }, storage)).toMatchObject({ sent: 2, waiting: 0 });
    expect(sent).toEqual(['entry-1', 'entry-2']);
  });

  it('stops at a lost connection and keeps the rest for the next try', async () => {
    const storage = memory();
    keepSave('a', { id: 'entry-1', kind: 'journal', payload: {} }, { storage, now });
    keepSave('a', { id: 'entry-2', kind: 'journal', payload: {} }, { storage, now });
    const tried = [];
    expect(await sendKeptSaves('a', async (save) => { tried.push(save.id); throw offline(); }, storage)).toMatchObject({ sent: 0, waiting: 2 });
    expect(tried).toEqual(['entry-1']);
  });

  it('keeps a refused save with its reason, and sends the others', async () => {
    const storage = memory();
    keepSave('a', { id: 'entry-1', kind: 'journal', payload: {} }, { storage, now });
    keepSave('a', { id: 'entry-2', kind: 'journal', payload: {} }, { storage, now });
    const send = async (save) => { if (save.id === 'entry-1') throw { message: 'value too long', code: '22001' }; };
    expect(await sendKeptSaves('a', send, storage)).toMatchObject({ sent: 1, waiting: 1 });
    expect(keptSaves('a', storage)).toEqual([expect.objectContaining({ id: 'entry-1', refused: 'value too long' })]);
    // It isn't sent again; the person decides.
    const tried = [];
    await sendKeptSaves('a', async (save) => { tried.push(save.id); }, storage);
    expect(tried).toEqual([]);
  });

  it('keeps a newer save for the same day that was kept while the older one was on its way', async () => {
    const storage = memory();
    keepSave('a', { id: 'check-in:2026-10-02', kind: 'check-in', payload: { mood_score: 3 } }, { storage, now });
    const send = async () => { keepSave('a', { id: 'check-in:2026-10-02', kind: 'check-in', payload: { mood_score: 8 } }, { storage, now }); };
    expect(await sendKeptSaves('a', send, storage)).toMatchObject({ sent: 1, waiting: 1 });
    expect(keptSaves('a', storage)[0].payload.mood_score).toBe(8);
  });
});

describe('what the account answers', () => {
  it('counts only an answer about the save itself as a refusal', () => {
    for (const code of ['42501', '23505', '23514', '22001', '22P02', 'P0001', 'PGRST116', 'PGRST204']) expect(isRefusal({ code })).toBe(true);
    // The session, the server, or the database being busy: tried again later.
    for (const code of ['PGRST301', 'PGRST002', 'PGRST003', '57014', '40001', '53300', '08006', 'XX000', '', undefined]) expect(isRefusal({ code })).toBe(false);
    expect(isRefusal({ message: '<html>502 Bad Gateway</html>' })).toBe(false);
  });

  it('keeps a save the server couldn\'t take for the next try', async () => {
    const storage = memory();
    keepSave('a', { id: 'entry-1', kind: 'journal', payload: {} }, { storage, now });
    keepSave('a', { id: 'entry-2', kind: 'journal', payload: {} }, { storage, now });
    const tried = [];
    const send = async (save) => { tried.push(save.id); throw { message: 'Bad gateway' }; };
    expect(await sendKeptSaves('a', send, storage)).toMatchObject({ sent: 0, waiting: 2 });
    expect(tried).toEqual(['entry-1']);
    expect(keptSaves('a', storage).some(needsChoice)).toBe(false);
  });

  it('leaves a save that would replace a version saved somewhere else for the person', async () => {
    const storage = memory();
    keepSave('a', { id: 'check-in:2026-10-02', kind: 'check-in', payload: { mood_score: 3 }, base: null }, { storage, now });
    keepSave('a', { id: 'entry-1', kind: 'journal', payload: {} }, { storage, now });
    const send = async (save) => { if (save.id.startsWith('check-in') && !save.force) throw changedElsewhere('This day already has a saved check-in.'); };
    expect(await sendKeptSaves('a', send, storage)).toMatchObject({ sent: 1, waiting: 1 });
    expect(keptSaves('a', storage)).toEqual([expect.objectContaining({ id: 'check-in:2026-10-02', conflict: 'This day already has a saved check-in.' })]);
    const tried = [];
    await sendKeptSaves('a', async (save) => { tried.push(save.id); }, storage);
    expect(tried).toEqual([]);
    // The person chooses this version: it's sent as it is.
    sendAgain('a', 'check-in:2026-10-02', storage);
    expect(keptSaves('a', storage)[0]).toEqual(expect.not.objectContaining({ conflict: expect.anything() }));
    expect(await sendKeptSaves('a', send, storage)).toMatchObject({ sent: 1, waiting: 0 });
  });

  it('tries a refused save again when the person asks', async () => {
    const storage = memory();
    keepSave('a', { id: 'entry-1', kind: 'journal', payload: {} }, { storage, now });
    await sendKeptSaves('a', async () => { throw { message: 'value too long', code: '22001' }; }, storage);
    expect(keptSaves('a', storage)[0].refused).toBe('value too long');
    sendAgain('a', 'entry-1', storage);
    const sent = [];
    expect(await sendKeptSaves('a', async (save) => { sent.push(save); }, storage)).toMatchObject({ sent: 1, waiting: 0 });
    expect(sent[0]).toEqual(expect.not.objectContaining({ refused: expect.anything(), force: true }));
  });

  it('never marks a newer save refused for an answer about an older one', async () => {
    const storage = memory();
    keepSave('a', { id: 'entry-1', kind: 'journal', payload: { notes: 'old' } }, { storage, now });
    const send = async () => {
      keepSave('a', { id: 'entry-1', kind: 'journal', payload: { notes: 'new' } }, { storage, now });
      throw { message: 'value too long', code: '22001' };
    };
    await sendKeptSaves('a', send, storage);
    expect(keptSaves('a', storage)).toEqual([expect.objectContaining({ payload: { notes: 'new' } })]);
    expect(keptSaves('a', storage).some(needsChoice)).toBe(false);
  });

  it('knows a stored row that already holds a save', () => {
    const payload = { date: '2026-10-02', mood_score: 7, notes: 'rain', emotions: ['Calm', 'Tired'], occurred_at: '2026-10-02T12:30:00.000Z', stress_context: { need: 'rest', asked_steps: ['mood'] }, high_moment: null, gratitude: undefined };
    const row = { id: 'x', user_id: 'a', updated_at: '2026-10-03T08:00:00+00:00', date: '2026-10-02', mood_score: 7, notes: 'rain', emotions: ['Calm', 'Tired'], occurred_at: '2026-10-02T12:30:00+00:00', stress_context: { asked_steps: ['mood'], need: 'rest' }, high_moment: null, gratitude: null };
    expect(holdsSave(row, payload)).toBe(true);
    expect(holdsSave({ ...row, notes: 'sun' }, payload)).toBe(false);
    expect(holdsSave({ ...row, emotions: ['Tired', 'Calm'] }, payload)).toBe(false);
    expect(holdsSave({ ...row, stress_context: { need: 'rest' } }, payload)).toBe(false);
    expect(holdsSave({ ...row, occurred_at: '2026-10-02T12:31:00+00:00' }, payload)).toBe(false);
    expect(holdsSave(undefined, payload)).toBe(false);
  });
});

describe('versions kept on this device', () => {
  it('remembers the versions a save replaces, newest first, a few at most', () => {
    const storage = memory();
    for (const mood of [3, 4, 5, 6, 7]) keepSave('a', { id: 'check-in:2026-10-02', kind: 'check-in', payload: { mood_score: mood } }, { storage, now });
    const [save] = keptSaves('a', storage);
    expect(save.payload).toEqual({ mood_score: 7 });
    expect(save.prior).toEqual([{ mood_score: 6 }, { mood_score: 5 }, { mood_score: 4 }]);
  });

  it('remembers the version an edit began from, once', () => {
    const storage = memory();
    keepSave('a', { id: 'entry-1', kind: 'journal', edit: true, payload: { notes: 'first' } }, { storage, now });
    keepSave('a', { id: 'entry-1', kind: 'journal', edit: true, payload: { notes: 'second' }, prior: [{ notes: 'first' }] }, { storage, now });
    expect(keptSaves('a', storage)[0].prior).toEqual([{ notes: 'first' }]);
    // Begun from a kept version that has since been sent, it still knows it.
    keepSave('a', { id: 'entry-2', kind: 'journal', edit: true, payload: { notes: 'later' }, prior: [{ notes: 'sent' }] }, { storage, now });
    expect(keptSaves('a', storage)[1].prior).toEqual([{ notes: 'sent' }]);
  });

  it('knows a stored row written from this device', () => {
    /** @type {import('../kept-saves').KeptSave} */
    const save = { id: 'check-in:2026-10-02', kind: 'check-in', payload: { mood_score: 7 }, prior: [{ mood_score: 5 }], keptAt: '', version: 'v' };
    expect(writtenHere({ mood_score: 7, notes: null }, save)).toBe(true);
    expect(writtenHere({ mood_score: 5 }, save)).toBe(true);
    expect(writtenHere({ mood_score: 3 }, save)).toBe(false);
  });

  it('says what kinds of save were sent', async () => {
    const storage = memory();
    keepSave('a', { id: 'check-in:2026-10-02', kind: 'check-in', payload: {} }, { storage, now });
    keepSave('a', { id: 'entry-1', kind: 'journal', payload: {} }, { storage, now });
    const { kinds } = await sendKeptSaves('a', async () => {}, storage);
    expect([...kinds].sort()).toEqual(['check-in', 'journal']);
  });
});

describe('holding the kept saves', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('runs the work at once where the browser has no locks', async () => {
    vi.stubGlobal('navigator', {});
    expect(await holdKeptSaves('a', async () => 'done')).toBe('done');
  });

  it('runs the work holding the lock the sender holds', async () => {
    const held = [];
    vi.stubGlobal('navigator', { locks: { request: async (name, ...rest) => { held.push(name); return rest.at(-1)(); } } });
    expect(await holdKeptSaves('a', async () => 'done')).toBe('done');
    expect(held).toEqual(['vibe-kept-saves:a']);
  });

  it('stops waiting for a send that hangs', async () => {
    // A lock that's never released: only the signal ends the wait.
    const request = (_name, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    });
    vi.stubGlobal('navigator', { locks: { request } });
    expect(await holdKeptSaves('a', async () => 'done', { waitMs: 10 })).toBe('done');
  });
});
