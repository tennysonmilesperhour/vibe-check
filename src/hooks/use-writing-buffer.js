import { useEffect } from 'react';
import { writeBuffer } from '@/lib/writing-buffer';

/**
 * Mirror unsaved writing into this tab's buffer while `enabled`. Writes are
 * immediate so a sudden reload keeps the last keystroke; callers clear the
 * buffer themselves once the words are saved or discarded.
 */
export default function useWritingBuffer(key, value, { enabled, basedOn = null }) {
  const serialized = enabled ? JSON.stringify(value) : null;
  useEffect(() => {
    if (key && serialized !== null) writeBuffer(key, JSON.parse(serialized), basedOn);
  }, [key, serialized, basedOn]);
}
