import { useEffect } from 'react';
import { writeSerializedBuffer } from '@/lib/writing-buffer';

/**
 * Mirror unsaved writing into this tab's buffer while `enabled`. Takes the
 * already-serialized form so a keystroke costs one JSON.stringify. Writes are
 * immediate so a sudden reload keeps the last keystroke; callers clear the
 * buffer themselves once the words are saved or discarded.
 */
export default function useWritingBuffer(key, serialized, { enabled, basedOn = null }) {
  useEffect(() => {
    if (key && enabled && serialized != null) writeSerializedBuffer(key, serialized, basedOn);
  }, [key, enabled, serialized, basedOn]);
}
