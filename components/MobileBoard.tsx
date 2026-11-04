'use client';

import { useState } from 'react';
import { Bot, Check, User } from 'lucide-react';
import { Rozmowa, Status } from '@/types/rozmowa';
import LiveTimer from './LiveTimer';

const DISPLAY_LABELS: Record<string, string> = { Ogolny: 'Ogólny' };
const dl = (v: string) => DISPLAY_LABELS[v] ?? v;

interface TabDef {
  status: Status;
  label: string;
  color: string;
  bg: string;
}

const TABS: TabDef[] = [
  { status: 'Pilne', label: 'Pilne', color: '#C00D0E', bg: '#FEF2F2' },
  { status: 'W trakcie', label: 'W trakcie', color: '#374151', bg: '#EFEFEF' },
  { status: 'Rozwiazane', label: 'Rozwiązane', color: '#9CA3AF', bg: '#F5F5F5' },
];

interface Props {
  rozmowy: Rozmowa[];
  onSelectCard: (id: string, e: React.MouseEvent) => void;
}

export default function MobileBoard({ rozmowy, onSelectCard }: Props) {
  const [active, setActive] = useState<Status>('Pilne');

  const grouped = Object.fromEntries(
    TABS.map(t => [t.status, rozmowy.filter(r => r.status === t.status)])
  ) as Record<Status, Rozmowa[]>;

  const records = grouped[active] ?? [];
  const activeTab = TABS.find(t => t.status === active)!;

  return (
    <div className="flex flex-col h-full">
      {/* Status tabs */}
      <div className="flex gap-2 shrink-0 pb-3">
        {TABS.map(t => {
          const isActive = t.status === active;
          const count = grouped[t.status]?.length ?? 0;
          return (
            <button
              key={t.status}
              onClick={() => setActive(t.status)}
              className="flex-1 text-center py-2 rounded-full text-xs font-semibold transition-colors"
              style={{
                backgroundColor: isActive ? t.bg : '#F5F5F4',
                color: isActive ? t.color : '#9CA3AF',
              }}
            >
              {t.label} <span className="opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pb-2">
        {records.length === 0 && (
          <div
            className="rounded-xl border-2 border-dashed p-8 text-center text-sm font-medium"
            style={{ borderColor: activeTab.bg, color: `${activeTab.color}80` }}
          >
            Pusto
          </div>
        )}

        {records.map(record => {
          const isRozwiazane = record.status === 'Rozwiazane';
          const borderCls =
            record.status === 'Pilne'
              ? 'border-red-200 bg-white active:border-red-300'
              : record.status === 'W trakcie'
              ? 'border-gray-200 bg-white active:border-gray-300'
              : 'border-gray-100 bg-[#FAFAFA] active:border-gray-200';

          return (
            <div
              key={record.id}
              onClick={e => onSelectCard(record.id, e)}
              className={`rounded-xl border-2 p-4 active:scale-[0.99] transition-transform select-none ${borderCls}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={`text-sm leading-tight truncate ${
                      isRozwiazane ? 'font-normal text-gray-500' : 'font-semibold text-gray-900'
                    }`}
                  >
                    {record.imieNazwisko || '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{record.nrTelefonu}</p>
                </div>

                {record.status === 'Pilne' && record.dataPołączenia && (
                  <span className="shrink-0 text-xs font-medium text-[#C00D0E] bg-red-50 px-1.5 py-0.5 rounded-md tabular-nums">
                    <LiveTimer from={record.dataPołączenia} />
                  </span>
                )}

                {record.status === 'Rozwiazane' && record.rozwiazaneBezCzlowieka && (
                  <span className="shrink-0 flex items-center gap-0.5 text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md">
                    <Bot size={11} strokeWidth={2} /> Auto
                  </span>
                )}
              </div>

              <p
                className={`mt-2 text-sm line-clamp-2 leading-snug ${
                  isRozwiazane ? 'text-gray-400' : 'text-gray-700'
                }`}
              >
                {record.temat}
              </p>

              <div className="mt-2 flex items-center justify-between gap-2">
                {record.specjalista && (
                  <span
                    className={`text-xs bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[140px] ${
                      isRozwiazane ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {dl(record.specjalista)}
                  </span>
                )}

                {record.status === 'W trakcie' && record.przypisanyKonsultant && (
                  <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                    <User size={11} strokeWidth={2} />
                    {record.przypisanyKonsultant}
                  </span>
                )}

                {record.status === 'Rozwiazane' && record.dataZamkniecia && (
                  <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                    <Check size={11} strokeWidth={2.5} />
                    {new Date(record.dataZamkniecia).toLocaleDateString('pl-PL')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
