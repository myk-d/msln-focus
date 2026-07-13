import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, BellOff, CalendarDays, ListTodo, LoaderCircle, LogOut, Target, Timer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';

const NAV_ITEMS = [
  { to: '/tasks', label: 'Завдання', icon: ListTodo },
  { to: '/calendar', label: 'Календар', icon: CalendarDays },
  { to: '/pomodoro', label: 'Помодоро', icon: Timer },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition ${
    isActive ? 'bg-brand-100 text-brand-700' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
  }`;

function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  const request = () => {
    if (permission !== 'default') return;
    Notification.requestPermission().then(setPermission);
  };

  // Ask once up front rather than waiting for the bell click — the button
  // still works as a manual retry if the browser mutes an un-gestured prompt.
  // `request` itself already no-ops when unsupported or already decided.
  useEffect(() => {
    request();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  return { permission, request };
}

function NotificationToggle({ variant }: { variant: 'rail' | 'bar' }) {
  const { permission, request } = useNotificationPermission();
  if (permission === 'unsupported') return null;

  const title =
    permission === 'granted'
      ? 'Сповіщення увімкнено'
      : permission === 'denied'
        ? 'Сповіщення заблоковано в браузері'
        : 'Дозволити сповіщення';

  return (
    <button
      onClick={request}
      title={title}
      className={`${variant === 'rail' ? 'mt-auto ' : ''}flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition ${
        permission === 'granted' ? 'text-brand-600' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
      }`}
    >
      {permission === 'denied' ? <BellOff size={19} /> : <Bell size={19} />}
      Сповіщення
    </button>
  );
}

function UserMenu() {
  const { user, signOutUser } = useAuth();
  const confirm = useConfirm();
  const [pending, setPending] = useState(false);
  if (!user) return null;

  const handleSignOut = async () => {
    if (!(await confirm({ title: 'Вийти з акаунту?', confirmLabel: 'Вийти' }))) return;
    setPending(true);
    try {
      await signOutUser();
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={() => void handleSignOut()}
      disabled={pending}
      title={`Вийти${user.displayName ? ` (${user.displayName})` : ''}`}
      className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 disabled:opacity-50"
    >
      {pending ? (
        <LoaderCircle size={19} className="animate-spin" />
      ) : user.photoURL ? (
        <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-5 w-5 rounded-full" />
      ) : (
        <LogOut size={19} />
      )}
      Вийти
    </button>
  );
}

export function NavRail() {
  return (
    <>
      {/* Desktop: vertical icon rail */}
      <nav className="hidden h-full w-16 shrink-0 flex-col items-center gap-2 border-r border-stone-200 bg-white py-4 md:flex">
        <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Target size={18} />
        </div>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navLinkClass}>
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
        <NotificationToggle variant="rail" />
        <UserMenu />
      </nav>

      {/* Mobile: bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-stone-200 bg-white py-1 md:hidden">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navLinkClass}>
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
        <NotificationToggle variant="bar" />
        <UserMenu />
      </nav>
    </>
  );
}
