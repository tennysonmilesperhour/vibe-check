import { Link } from 'react-router-dom';
import { ArrowRight, MessagesSquare, PenLine, Sun, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { todayKey } from '@/lib/dates';

// One place to add anything to the record, from any page. An interaction,
// the core relationship entry, is one choice here rather than an option
// inside the journal form.
const CHOICES = [
  { id: 'check-in', title: "Today's check-in", detail: 'How the day felt. A mood is enough.', icon: Sun, to: () => `/Today?date=${todayKey()}` },
  { id: 'moment', title: 'A moment', detail: 'Something that happened, in your own words.', icon: PenLine, to: () => '/Analytics?tab=journal&compose=1' },
  { id: 'interaction', title: 'An interaction', detail: 'Time with someone, and how it felt.', icon: MessagesSquare, to: () => '/Analytics?tab=journal&compose=1&kind=interaction' },
  { id: 'person', title: 'A person', detail: 'Someone in your orbit. They are not notified.', icon: UserPlus, to: () => '/People?add=1' },
];

export default function AddMenu({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What would you like to keep?</DialogTitle>
          <DialogDescription>It stays in your private record.</DialogDescription>
        </DialogHeader>
        <ul className="add-menu">
          {CHOICES.map((choice) => (
            <li key={choice.id}>
              <Link to={choice.to()} onClick={() => onOpenChange(false)}>
                <choice.icon size={20} aria-hidden="true" />
                <span><strong>{choice.title}</strong><span>{choice.detail}</span></span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
