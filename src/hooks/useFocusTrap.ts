import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

// Stack of mounted focus traps so stacked dialogs (e.g. ConfirmProvider over a
// detail drawer) yield Tab and Escape handling strictly to the topmost dialog.
const activeTraps: HTMLElement[] = [];

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      el.tabIndex >= 0 &&
      el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility !== 'hidden' &&
      !el.closest('[inert]')
  );
}

interface UseFocusTrapOptions {
  active?: boolean;
  onEscape?: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  { active = true, onEscape, initialFocusRef }: UseFocusTrapOptions = {}
) {
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    activeTraps.push(container);

    const initialTarget = initialFocusRef?.current;
    if (initialTarget && container.contains(initialTarget)) {
      initialTarget.focus({ preventScroll: true });
    } else if (!container.contains(document.activeElement)) {
      container.focus({ preventScroll: true });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTraps[activeTraps.length - 1] !== container) return;

      if (e.key === 'Escape') {
        if (e.defaultPrevented) return;
        if (onEscapeRef.current) {
          e.preventDefault();
          onEscapeRef.current();
        }
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        e.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (!current || !container.contains(current) || current === container) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }

      if (e.shiftKey) {
        if (current === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (activeTraps[activeTraps.length - 1] !== container) return;
      const target = e.target;
      if (target instanceof Node && !container.contains(target)) {
        container.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      const idx = activeTraps.lastIndexOf(container);
      if (idx !== -1) activeTraps.splice(idx, 1);

      if (opener && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [active, containerRef, initialFocusRef]);
}
