import { useTranslation } from 'react-i18next';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { THEME_PREFS, useTheme, type ThemePref } from '../hooks/useTheme';

const THEME_META: Record<ThemePref, { labelKey: string; icon: LucideIcon }> = {
  system: { labelKey: 'nav.themeSystem', icon: Monitor },
  light: { labelKey: 'nav.themeLight', icon: Sun },
  dark: { labelKey: 'nav.themeDark', icon: Moon },
};

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const { pref, setPref } = useTheme();

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-surface-sunken p-0.5" role="group" aria-label={t('nav.theme')}>
      {THEME_PREFS.map((value) => {
        const { labelKey, icon: Icon } = THEME_META[value];
        const active = pref === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPref(value)}
            aria-pressed={active}
            aria-label={t(labelKey)}
            title={t(labelKey)}
            className={`rounded-md p-1.5 transition-colors ${
              active ? 'bg-surface-raised text-primary shadow-sm' : 'text-muted hover:text-text'
            }`}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
