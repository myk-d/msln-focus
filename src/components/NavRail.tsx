import { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff, CalendarDays, ChartColumn, ListTodo, LoaderCircle, LogOut, Target, Timer, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { menuItemClass, popoverClass } from '../lib/ui';
import { LanguageSwitcher } from './LanguageSwitcher';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition md:w-full ${
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

  // Requesting must stay gesture-only (triggered from the bell's onClick) —
  // iOS Safari silently denies (never shows the OS prompt, and locks
  // permission at 'denied') any requestPermission() call not made from a
  // trusted user gesture, so an auto-prompt-on-mount permanently breaks
  // notifications on iOS home-screen installs instead of just being ignored.
  return { permission, request };
}

// Avatar-triggered popover consolidating notifications, language, and sign-out
// — the account-scoped settings — behind one menu instead of three permanent
// rail/bar items.
function AccountMenu({ variant }: { variant: 'rail' | 'bar' }) {
  const { t } = useTranslation();
  const { user, signOutUser } = useAuth();
  const { permission, request } = useNotificationPermission();
  const confirm = useConfirm();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  if (!user) return null;

  const notificationsTitle =
    permission === 'granted'
      ? t('nav.notificationsOn')
      : permission === 'denied'
        ? t('nav.notificationsBlocked')
        : t('nav.notificationsAllow');

  const handleSignOut = async () => {
    if (!(await confirm({ title: t('nav.signOutConfirmTitle'), confirmLabel: t('nav.signOut') }))) return;
    setPending(true);
    try {
      await signOutUser();
    } finally {
      setPending(false);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className={`relative ${variant === 'rail' ? 'mt-auto' : ''}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={user.displayName ?? t('nav.account')}
        className="flex h-9 w-9 items-center justify-center rounded-full transition hover:ring-2 hover:ring-stone-200"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-stone-500">
            <User size={16} />
          </div>
        )}
      </button>

      {open && (
        <div
          className={`${popoverClass} absolute z-30 w-56 p-1 text-sm ${
            variant === 'rail' ? 'bottom-0 left-full ml-2' : 'bottom-full right-0 mb-2'
          }`}
        >
          {permission !== 'unsupported' && (
            <button onClick={request} className={menuItemClass}>
              {permission === 'denied' ? <BellOff size={15} /> : <Bell size={15} className={permission === 'granted' ? 'text-brand-600' : ''} />}
              {notificationsTitle}
            </button>
          )}

          <div className={`${menuItemClass} justify-between`}>
            <span className="text-stone-500">{t('nav.language')}</span>
            <LanguageSwitcher />
          </div>

          <div className="my-1 border-t border-stone-100" />

          <button
            onClick={() => void handleSignOut()}
            disabled={pending}
            className={`${menuItemClass} text-red-500 hover:bg-red-50 disabled:opacity-50`}
          >
            {pending ? <LoaderCircle size={15} className="animate-spin" /> : <LogOut size={15} />}
            {t('nav.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}

export function NavRail() {
  const { t } = useTranslation();
  const navItems = [
    { to: '/tasks', label: t('nav.tasks'), icon: ListTodo },
    { to: '/calendar', label: t('nav.calendar'), icon: CalendarDays },
    { to: '/pomodoro', label: t('nav.pomodoro'), icon: Timer },
    { to: '/stats', label: t('nav.stats'), icon: ChartColumn },
  ];

  return (
    <>
      {/* Desktop: vertical icon rail */}
      <nav className="hidden h-full w-16 shrink-0 flex-col items-center gap-2 border-r border-stone-200 bg-white py-4 md:flex">
        <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Target size={18} />
        </div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navLinkClass}>
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
        <AccountMenu variant="rail" />
      </nav>

      {/* Mobile: bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-stone-200 bg-white py-1 md:hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navLinkClass}>
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
        <AccountMenu variant="bar" />
      </nav>
    </>
  );
}
