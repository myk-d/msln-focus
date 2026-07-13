import type { PointerEvent as ReactPointerEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { HOUR_HEIGHT, SNAP_MINUTES, TAG_COLOR_META, minutesToTime, timeToMinutes } from '../../lib/utils';
import type { CalendarEvent } from '../../types';

interface EventBlockProps {
  event: CalendarEvent;
  overlapIndex: number;
  onSelect: () => void;
  onResize: (endTime: string) => void;
}

// Drag (move) goes through @dnd-kit like the rest of the app's drag-and-drop.
// Resize is a raw pointer listener instead — dnd-kit models drag-to-a-droppable,
// not elastic resize, so the bottom-edge handle stops propagation (never reaches
// the draggable's own listeners) and tracks the pointer directly.
export function EventBlock({ event, overlapIndex, onSelect, onResize }: EventBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `event:${event.id}` });

  const startMinutes = timeToMinutes(event.startTime);
  const endMinutes = timeToMinutes(event.endTime);
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 18);

  const handleResizeStart = (downEvent: ReactPointerEvent) => {
    downEvent.stopPropagation();
    downEvent.preventDefault();
    const startY = downEvent.clientY;

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaMinutes = ((moveEvent.clientY - startY) / HOUR_HEIGHT) * 60;
      const nextEndMinutes = Math.max(startMinutes + SNAP_MINUTES, endMinutes + deltaMinutes);
      onResize(minutesToTime(nextEndMinutes));
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        top,
        height,
        left: `${overlapIndex * 10}%`,
        width: `${100 - overlapIndex * 10}%`,
        zIndex: 10 + overlapIndex,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.6 : 1,
      }}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={`absolute cursor-grab overflow-hidden rounded-lg border border-black/5 px-1.5 py-0.5 text-left text-[11px] shadow-sm active:cursor-grabbing ${TAG_COLOR_META[event.color].bg} ${TAG_COLOR_META[event.color].text}`}
    >
      <div className="truncate font-semibold">{event.title}</div>
      {!event.allDay && (
        <div className="truncate opacity-70">
          {event.startTime}–{event.endTime}
        </div>
      )}
      <div onPointerDown={handleResizeStart} className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize" />
    </div>
  );
}
