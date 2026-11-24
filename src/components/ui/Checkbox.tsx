import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  size?: 'sm' | 'md';
}

export function Checkbox({ checked, onChange, size = 'md' }: CheckboxProps) {
  const dims = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full border-2 transition ${
        checked ? 'border-primary bg-primary' : 'border-border-strong bg-surface hover:border-ring'
      }`}
    >
      {checked && <Check className="h-3 w-3 text-on-primary" strokeWidth={3} />}
    </button>
  );
}
