'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState } from 'react';
import { Rozmowa, Status } from '@/types/rozmowa';
import KanbanColumn from './KanbanColumn';
import NotePopup from './NotePopup';
import MobileBoard from './MobileBoard';

interface Column {
  status: Status;
  label: string;
  color: string;
  bg: string;
  borderColor: string;
}

const COLUMNS: Column[] = [
  { status: 'Pilne', label: 'Pilne', color: '#C00D0E', bg: '#FEF2F2', borderColor: '#FECACA' },
  { status: 'W trakcie', label: 'W trakcie', color: '#374151', bg: '#EFEFEF', borderColor: '#D1D5DB' },
  { status: 'Rozwiazane', label: 'Rozwiązane', color: '#9CA3AF', bg: '#F5F5F5', borderColor: '#E5E7EB' },
];

interface Props {
  rozmowy: Rozmowa[];
  onMoveCard: (id: string, status: Status, note?: string, autor?: string) => Promise<void>;
  onSelectCard: (id: string, e: React.MouseEvent) => void;
  selectedId: string | null;
}

function DragPreview({ record }: { record: Rozmowa }) {
  return (
    <div className="rounded-xl border-2 border-gray-300 bg-white p-4 shadow-2xl rotate-2 opacity-95 w-64">
      <p className="font-semibold text-gray-900 text-sm leading-tight">{record.imieNazwisko || '—'}</p>
      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{record.temat}</p>
    </div>
  );
}

export default function KanbanBoard({ rozmowy, onMoveCard, onSelectCard, selectedId }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ id: string; to: Status } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const recordId = active.id as string;
    const newStatus = over.id as Status;
    const record = rozmowy.find(r => r.id === recordId);
    if (!record || record.status === newStatus) return;

    // Pilne → W trakcie requires note popup
    if (record.status === 'Pilne' && newStatus === 'W trakcie') {
      setPendingMove({ id: recordId, to: newStatus });
      return;
    }

    onMoveCard(recordId, newStatus);
  };

  const activeRecord = activeId ? rozmowy.find(r => r.id === activeId) : null;

  const grouped = Object.fromEntries(
    COLUMNS.map(col => [col.status, rozmowy.filter(r => r.status === col.status)])
  ) as Record<Status, Rozmowa[]>;

  return (
    <>
      <div className="hidden md:block h-full">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-8 h-full">
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.status}
                status={col.status}
                label={col.label}
                color={col.color}
                bg={col.bg}
                borderColor={col.borderColor}
                records={grouped[col.status] ?? []}
                selectedId={selectedId}
                activeId={activeId}
                onSelectCard={onSelectCard}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeRecord ? <DragPreview record={activeRecord} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <div className="md:hidden h-full">
        <MobileBoard rozmowy={rozmowy} onSelectCard={onSelectCard} />
      </div>

      {pendingMove && (
        <NotePopup
          onConfirm={(note, autor) => {
            onMoveCard(pendingMove.id, pendingMove.to, note, autor);
            setPendingMove(null);
          }}
          onCancel={() => setPendingMove(null)}
        />
      )}
    </>
  );
}
