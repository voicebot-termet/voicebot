'use client';

import { useDroppable } from '@dnd-kit/core';
import { Rozmowa, Status } from '@/types/rozmowa';
import KanbanCard from './KanbanCard';

interface Props {
  status: Status;
  label: string;
  color: string;
  bg: string;
  borderColor: string;
  records: Rozmowa[];
  selectedId: string | null;
  activeId: string | null;
  onSelectCard: (id: string, e: React.MouseEvent) => void;
}

export default function KanbanColumn({
  status, label, color, bg, borderColor, records,
  selectedId, activeId, onSelectCard,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0">
      {/* Static header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 shrink-0"
        style={{ backgroundColor: bg }}
      >
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="font-bold text-sm" style={{ color }}>{label}</span>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-xs font-bold text-white leading-none"
          style={{ backgroundColor: color }}
        >
          {records.length}
        </span>
      </div>

      {/* Drop zone with independent scroll */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-2.5 rounded-xl p-2 transition-colors duration-150"
        style={{
          backgroundColor: isOver ? bg : undefined,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: isOver ? color : 'transparent',
        }}
      >
        {records.length === 0 && !isOver && (
          <div
            className="rounded-xl border-2 border-dashed p-8 text-center text-sm font-medium"
            style={{ borderColor, color: color + '60' }}
          >
            Pusto
          </div>
        )}
        {records.map(record => (
          <KanbanCard
            key={record.id}
            record={record}
            isSelected={selectedId === record.id}
            isActive={activeId === record.id}
            onClick={e => onSelectCard(record.id, e)}
          />
        ))}
      </div>
    </div>
  );
}
