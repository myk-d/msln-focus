import { useTranslation } from 'react-i18next';

const LANGUAGES = ['uk', 'en'] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = LANGUAGES.find((l) => i18n.language.startsWith(l)) ?? 'uk';

  return (
    <div className="flex items-center gap-0.5">
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => i18n.changeLanguage(lang)}
          className={`rounded px-1.5 py-1 text-[10px] font-bold uppercase transition-colors ${
            current === lang ? 'text-brand-600' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
