import { Flag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PRIORITY_META, PRIORITY_ORDER } from '../../lib/utils';
import type { Priority } from '../../types';

interface PriorityPickerProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

export function PriorityPicker({ value, onChange }: PriorityPickerProps) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-1">
      {PRIORITY_ORDER.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          title={t(PRIORITY_META[p].labelKey)}
          className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
            value === p ? 'border-brand-400 bg-brand-50' : 'border-transparent hover:bg-stone-100'
          }`}
        >
          <Flag className={PRIORITY_META[p].colorClass} size={15} fill={p === 'none' ? 'none' : 'currentColor'} />
        </button>
      ))}
    </div>
  );
}
