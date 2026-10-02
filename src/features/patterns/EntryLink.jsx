import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { formatDay } from '@/lib/dates';

/** A link that opens one entry in the journal. */
export default function EntryLink({ entry, children, className = '' }) {
  return <Link className={`living-text-link ${className}`.trim()} to={`/Analytics?tab=journal&entry=${encodeURIComponent(entry.key)}`}>{children || formatDay(entry.date)}<ArrowUpRight size={13} aria-hidden="true" /></Link>;
}
