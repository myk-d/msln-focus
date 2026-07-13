import { useEffect, useState } from 'react';
import { CalendarDays, ListTodo, Timer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: ListTodo,
    title: 'Завдання',
    description: 'Списки, секції, теги, пріоритети, підзавдання та дедлайни — усе в одному місці.',
  },
  {
    icon: CalendarDays,
    title: 'Календар',
    description: 'Місяць, тиждень, день і список подій — з перетягуванням і зміною тривалості.',
  },
  {
    icon: Timer,
    title: 'Помодоро',
    description: 'Таймер фокусу з пресетами, статистикою та зв’язком із конкретним завданням.',
  },
];

export function WelcomePage() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Focus-Pocus — фокус, завдання та час в одному додатку';
  }, []);

  const handleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch {
      setError('Не вдалося увійти. Спробуйте ще раз.');
    }
  };

  return (
    <div className="flex h-dvh w-full flex-col items-center overflow-y-auto bg-canvas px-6 py-16">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg">
        <Timer size={28} />
      </div>
      <h1 className="text-center text-3xl font-black tracking-tight text-stone-900">Focus-Pocus</h1>
      <p className="mt-2 max-w-md text-center text-sm text-stone-500">
        Задачі, календар і Помодоро-таймер — в одному додатку, синхронізовані з вашим Google-акаунтом.
      </p>

      <button
        onClick={handleSignIn}
        className="mt-8 flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700"
      >
        Увійти через Google
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
