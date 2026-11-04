'use client';

import { useDraggable } from '@dnd-kit/core';
import { Bot, Check, User } from 'lucide-react';
import { Rozmowa } from '@/types/rozmowa';
import LiveTimer from './LiveTimer';

const DISPLAY_LABELS: Record<string, string> = { Ogolny: 'Ogólny' };
const dl = (v: string) => DISPLAY_LABELS[v] ?? v;

interface Props {
  record: Rozmowa;
  isSelected: boolean;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export default function KanbanCard({ record, isSelected, isActive, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: record.id });
  const { status } = record;

  // ── Per-status border + background ────────────────────────────────────────
  let borderCls: string;
  let extraStyle: React.CSSProperties = {};

  if (status === 'Pilne') {
    borderCls = isSelected
      ? 'border-[#C00D0E] shadow-md bg-red-50/20'
      : 'border-red-200 bg-white hover:border-red-300 hover:shadow-sm';

  } else if (status === 'W trakcie') {
    borderCls = isSelected
      ? 'border-gray-700 shadow-md bg-gray-50'
      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm';
    // Left accent: inline style overrides just the left border
    extraStyle = { borderLeftColor: '#1F2937', borderLeftWidth: '3px' };

  } else {
    // Rozwiązane — visually recedes as archive
    borderCls = isSelected
      ? 'border-gray-300 shadow-sm bg-[#FAFAFA]'
      : 'border-gray-100 bg-[#FAFAFA] hover:border-gray-200';
  }

  const cardStyle: React.CSSProperties = {
    ...(transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : {}),
    ...extraStyle,
  };

  const isRozwiazane = status === 'Rozwiazane';

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`rounded-xl border-2 p-4 cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
        isActive ? 'opacity-30' : 'opacity-100'
      } ${borderCls}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {/* Name — lighter weight for Rozwiązane */}
          <p className={`text-sm leading-tight truncate ${
            isRozwiazane ? 'font-normal text-gray-500' : 'font-semibold text-gray-900'
          }`}>
            {record.imieNazwisko || '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{record.nrTelefonu}</p>
        </div>

        {status === 'Pilne' && record.dataPołączenia && (
          <span className="shrink-0 text-xs font-medium text-[#C00D0E] bg-red-50 px-1.5 py-0.5 rounded-md tabular-nums">
            <LiveTimer from={record.dataPołączenia} />
          </span>
        )}

        {status === 'Rozwiazane' && record.rozwiazaneBezCzlowieka && (
          <span className="shrink-0 flex items-center gap-0.5 text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md">
            <Bot size={11} strokeWidth={2} /> Auto
          </span>
        )}
      </div>

      {/* Topic — muted for Rozwiązane */}
      <p className={`mt-2 text-sm line-clamp-2 leading-snug ${
        isRozwiazane ? 'text-gray-400' : 'text-gray-700'
      }`}>
        {record.temat}
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        {record.specjalista && (
          <span className={`text-xs bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[120px] ${
            isRozwiazane ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {dl(record.specjalista)}
          </span>
        )}

        {status === 'W trakcie' && record.przypisanyKonsultant && (
          <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
            <User size={11} strokeWidth={2} />
            {record.przypisanyKonsultant}
          </span>
        )}

        {status === 'Rozwiazane' && record.dataZamkniecia && (
          <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
            <Check size={11} strokeWidth={2.5} />
            {new Date(record.dataZamkniecia).toLocaleDateString('pl-PL')}
          </span>
        )}
      </div>
    </div>
  );
}
