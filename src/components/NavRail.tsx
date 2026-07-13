import { NavLink } from 'react-router-dom';
import { ListTodo, Target, Timer } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/tasks', label: 'Завдання', icon: ListTodo },
  { to: '/pomodoro', label: 'Помодоро', icon: Timer },
];

export function NavRail() {
  return (
    <nav className="flex h-full w-16 shrink-0 flex-col items-center gap-2 border-r border-stone-200 bg-white py-4">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
        <Target size={18} />
      </div>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition ${
              isActive ? 'bg-brand-100 text-brand-700' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
            }`
          }
        >
          <Icon size={19} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
