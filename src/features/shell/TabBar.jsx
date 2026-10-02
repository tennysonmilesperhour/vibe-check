import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

/**
 * The phone's main navigation: four surfaces within thumb reach, with Add
 * in the middle. Cosmos, Settings and the rest stay in the menu.
 * @param {{ items: any[], isActive: (item: any) => boolean, onAdd: () => void, inert?: boolean }} props
 */
export default function TabBar({ items, isActive, onAdd, inert = false }) {
  const link = (item) => (
    <Link key={item.title} to={item.url} className="tab-bar-item" aria-current={isActive(item) ? 'page' : undefined}>
      <span className="tab-bar-icon"><item.icon aria-hidden="true" /></span>
      <span>{item.title}</span>
    </Link>
  );
  return (
    <nav className="tab-bar md:hidden" aria-label="Main" inert={inert ? '' : undefined}>
      {items.slice(0, 2).map(link)}
      <button type="button" className="tab-bar-item" aria-haspopup="dialog" onClick={onAdd}>
        <span className="tab-bar-add"><Plus aria-hidden="true" /></span>
        <span>Add</span>
      </button>
      {items.slice(2, 4).map(link)}
    </nav>
  );
}
