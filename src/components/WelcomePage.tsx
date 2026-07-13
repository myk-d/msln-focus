import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ListTodo, LoaderCircle, Timer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function WelcomePage() {
  const { t, i18n } = useTranslation();
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const FEATURES = [
    { icon: ListTodo, title: t('welcome.featureTasksTitle'), description: t('welcome.featureTasksDescription') },
    {
      icon: CalendarDays,
      title: t('welcome.featureCalendarTitle'),
      description: t('welcome.featureCalendarDescription'),
    },
    {
      icon: Timer,
      title: t('welcome.featurePomodoroTitle'),
      description: t('welcome.featurePomodoroDescription'),
    },
  ];

  useEffect(() => {
    document.title = t('welcome.documentTitle');
  }, [t, i18n.language]);

  const handleSignIn = async () => {
    setError('');
    setPending(true);
    try {
      await signInWithGoogle();
    } catch {
      setError(t('welcome.signInError'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative flex h-dvh w-full flex-col items-center overflow-y-auto bg-canvas px-6 py-16">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg">
        <Timer size={28} />
      </div>
      <h1 className="text-center text-3xl font-black tracking-tight text-stone-900">Focus-Pocus</h1>
      <p className="mt-2 max-w-md text-center text-sm text-stone-500">{t('welcome.tagline')}</p>

      <button
        onClick={() => void handleSignIn()}
        disabled={pending}
        className="mt-8 flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && <LoaderCircle size={16} className="animate-spin" />}
        {t('welcome.signInWithGoogle')}
      </button>
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      <div className="mt-14 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Icon size={20} />
            </div>
            <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
            <p className="mt-1 text-xs text-stone-500">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
