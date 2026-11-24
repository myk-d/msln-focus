import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronDown, LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AxoIcon } from './brand/AxoIcon';
import { AxoWordmark } from './brand/AxoWordmark';
import { Axl } from './brand/Axl';
import { RoundCheck } from './ui/RoundCheck';
import { ProductShot, TimerPreview } from './landing/ProductShot';
import { BoardSnippet, CalendarSnippet, ListsSnippet, PomodoroSnippet } from './landing/FeatureSnippets';

// Public landing page for signed-out users (docs/product/brand/landing-uk.html / landing-en.html).
// Only claims what the app really does; Google is the only sign-in method.
const section = 'mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-14 md:gap-10 md:px-10 md:py-24';
const h2 = 'font-display text-[28px] font-semibold leading-9 tracking-tight text-balance md:text-[40px] md:leading-[48px]';
const lead = 'max-w-[60ch] text-base text-muted md:text-lg md:leading-7';

export function WelcomePage() {
  const { t, i18n } = useTranslation();
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

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

  const signInButton = (
    <button
      onClick={() => void handleSignIn()}
      disabled={pending}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-bold text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending && <LoaderCircle size={18} className="animate-spin" />}
      {t('welcome.signInWithGoogle')}
    </button>
  );

  const features = [
    { key: 'lists', snippet: <ListsSnippet /> },
    { key: 'pomodoro', snippet: <PomodoroSnippet /> },
    { key: 'board', snippet: <BoardSnippet /> },
    { key: 'calendar', snippet: <CalendarSnippet /> },
  ] as const;
  const steps = ['signIn', 'plan', 'focus'] as const;
  const faq = ['signIn', 'privacy', 'mobile', 'languages', 'agents', 'attachments'] as const;
  const points = ['presets', 'stats', 'pip'] as const;

  return (
    <div className="h-dvh w-full overflow-y-auto bg-bg text-text">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 md:gap-8 md:px-10">
          <a href="#top" className="flex items-center" aria-label="Axo">
            <AxoIcon size={32} className="text-primary md:hidden" label={null} />
            <AxoWordmark height={28} className="hidden text-primary md:block" label={null} />
          </a>
          <nav className="hidden flex-1 items-center gap-6 text-sm font-semibold md:flex">
            <a href="#features" className="text-text hover:text-primary">{t('welcome.nav.features')}</a>
            <a href="#how" className="text-text hover:text-primary">{t('welcome.nav.how')}</a>
            <a href="#faq" className="text-text hover:text-primary">{t('welcome.nav.faq')}</a>
          </nav>
          <span className="flex-1 md:hidden" />
          <LanguageSwitcher />
          <button
            onClick={() => void handleSignIn()}
            disabled={pending}
            className="min-h-11 rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-text transition hover:bg-surface-hover disabled:opacity-60 md:border-transparent md:bg-primary md:text-on-primary md:hover:bg-primary-hover"
          >
            {t('welcome.signIn')}
          </button>
        </div>
      </header>

      <main id="top">
        {/* Hero: sign-in stays in the first screen on a 390 px phone */}
        <section className={`${section} md:grid md:grid-cols-2 md:items-center md:gap-14 md:pt-20`}>
          <div className="flex flex-col gap-5 md:gap-6">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-accent">{t('welcome.eyebrow')}</span>
            <h1 className="font-display text-4xl font-semibold leading-[44px] tracking-tight text-balance md:text-[60px] md:leading-[68px]">
              {t('welcome.heroTitle')}
            </h1>
            <p className={lead}>{t('welcome.heroLead')}</p>
            <div className="flex flex-wrap items-center gap-3">
              {signInButton}
              <a href="#how" className="hidden min-h-12 items-center gap-2 rounded-xl px-5 text-base font-bold text-primary hover:bg-primary-soft sm:flex">
                {t('welcome.howLink')} <ArrowRight size={16} />
              </a>
            </div>
            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}
            <div className="flex items-center gap-3">
              <Axl emotion="joy" width={60} />
              <span className="max-w-[36ch] text-sm text-muted">{t('welcome.trust')}</span>
            </div>
          </div>
          <ProductShot />
        </section>

        <section id="features" className="scroll-mt-16 border-y border-border bg-surface">
          <div className={section}>
            <div className="flex flex-col gap-3">
              <h2 className={h2}>{t('welcome.featuresTitle')}</h2>
              <p className={lead}>{t('welcome.featuresLead')}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              {features.map(({ key, snippet }) => (
                <article key={key} className="flex flex-col gap-3.5 rounded-2xl border border-border bg-bg p-5 md:p-6">
                  {snippet}
                  <h3 className="text-lg font-extrabold text-text">{t(`welcome.features.${key}.title`)}</h3>
                  <p className="text-muted">{t(`welcome.features.${key}.body`)}</p>
                </article>
              ))}
            </div>
            <div className="flex flex-col gap-4 rounded-2xl border-[1.5px] border-dashed border-border-strong p-5 md:flex-row md:items-center md:px-6">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-avatar-claude text-sm font-bold text-white" aria-hidden>
                C
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 text-base font-bold">
                  {t('welcome.agentTitle')}
                  <span className="rounded-md bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">{t('welcome.agentBadge')}</span>
                </div>
                <p className="mt-1 text-muted">{t('welcome.agentBody')}</p>
              </div>
              <span className="font-mono text-xs text-muted">GET /api/docs</span>
            </div>
          </div>
        </section>

        <section id="how" className={`${section} scroll-mt-16`}>
          <h2 className={h2}>{t('welcome.howTitle')}</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map((key, i) => (
              <li key={key} className="flex flex-col gap-2.5 border-t-2 border-primary pt-4">
                <span className="font-mono font-semibold text-accent">0{i + 1}</span>
                <span className="text-lg font-bold text-text">{t(`welcome.steps.${key}.title`)}</span>
                <span className="text-muted">{t(`welcome.steps.${key}.body`)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-primary text-on-primary">
          <div className={`${section} md:grid md:grid-cols-2 md:items-center md:gap-16`}>
            <div className="flex flex-col gap-4">
              <h2 className={h2}>{t('welcome.highlightTitle')}</h2>
              <p className="text-base leading-7 opacity-90 md:text-[17px]">{t('welcome.highlightBody')}</p>
              <ul className="flex flex-col gap-2.5">
                {points.map((key) => (
                  <li key={key} className="flex items-center gap-2.5">
                    <RoundCheck size={18} />
                    {t(`welcome.highlightPoints.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3.5 md:items-end" aria-hidden>
              <div className="flex w-full items-center gap-5 rounded-2xl bg-surface p-5 text-text md:max-w-[440px]">
                <TimerPreview size={120} label={t('pomodoro.focus')} />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="font-mono text-xs text-muted">AXO-17</span>
                  <span className="font-bold">{t('welcome.shot.task1')}</span>
                </div>
              </div>
              <div className="flex w-full items-center gap-2.5 rounded-xl bg-surface px-4 py-3 text-text shadow-[0_8px_24px_rgb(0_0_0/0.08)] md:max-w-[440px]">
                <RoundCheck done className="text-success" />
                <span className="font-bold">{t('welcome.sessionDone')}</span>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className={`${section} scroll-mt-16`}>
          <h2 className={h2}>{t('welcome.faqTitle')}</h2>
          <div className="grid md:grid-cols-2 md:gap-x-12">
            {faq.map((key, i) => (
              <details key={key} className="group border-t border-border py-4" open={i < 2}>
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-text [&::-webkit-details-marker]:hidden">
                  {t(`welcome.faq.${key}.q`)}
                  <ChevronDown size={16} className="shrink-0 text-muted transition group-open:rotate-180" />
                </summary>
                <p className="mt-2 max-w-[62ch] text-muted">{t(`welcome.faq.${key}.a`)}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-surface">
          <div className={`${section} items-center text-center`}>
            <Axl emotion="playful" width={140} />
            <h2 className={h2}>{t('welcome.finalTitle')}</h2>
            <p className={`${lead} -mt-4`}>{t('welcome.finalBody')}</p>
            {signInButton}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-7 md:flex-row md:items-center md:gap-6 md:px-10">
          <AxoWordmark height={22} label={null} />
          <span className="flex-1 text-sm text-muted">{t('welcome.footer', { year: new Date().getFullYear() })}</span>
          <LanguageSwitcher />
        </div>
      </footer>
    </div>
  );
}
