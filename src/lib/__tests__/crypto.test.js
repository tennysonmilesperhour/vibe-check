import { describe, it, expect } from 'vitest';
import { encryptJson, decryptJson } from '../crypto.js';

describe('encryptJson / decryptJson', () => {
  it('round-trips an object with the right password', async () => {
    const secret = { checkIns: [{ date: '2026-07-02', mood_score: 8 }], note: 'ünïcode ✦' };
    const envelope = await encryptJson(secret, 'correct horse battery');
    expect(envelope.v).toBe(1);
    expect(envelope.salt).toBeTypeOf('string');
    expect(envelope.iv).toBeTypeOf('string');
    // ciphertext must not contain plaintext
    expect(envelope.data).not.toContain('2026-07-02');

    const back = await decryptJson(envelope, 'correct horse battery');
    expect(back).toEqual(secret);
  });

  it('rejects the wrong password', async () => {
    const envelope = await encryptJson({ a: 1 }, 'right');
    await expect(decryptJson(envelope, 'wrong')).rejects.toThrow();
  });

  it('round-trips a large history', async () => {
    // A few megabytes: building the base64 from one spread call threw past a
    // few hundred kilobytes.
    const entries = Array.from({ length: 6000 }, (_, i) => ({ date: '2026-07-02', notes: `Entry ${i}: ${'a quiet evening walk '.repeat(20)}` }));
    const envelope = await encryptJson({ entries }, 'correct horse battery');
    expect(envelope.data.length).toBeGreaterThan(2_000_000);
    expect((await decryptJson(envelope, 'correct horse battery')).entries).toHaveLength(6000);
  });

  it('produces distinct ciphertexts per call (fresh salt + iv)', async () => {
    const a = await encryptJson({ a: 1 }, 'pw');
    const b = await encryptJson({ a: 1 }, 'pw');
    expect(a.data).not.toBe(b.data);
    expect(a.salt).not.toBe(b.salt);
  });
});
