'use client';

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Rozmowa, Status } from '@/types/rozmowa';

const DISPLAY_LABELS: Record<string, string> = { Rozwiazane: 'Rozwiązane' };
const dl = (v: string) => DISPLAY_LABELS[v] ?? v;

const STATUS_STYLE: Record<Status, { color: string; bg: string }> = {
  Pilne:      { color: '#C00D0E', bg: '#FEF2F2' },
  'W trakcie': { color: '#374151', bg: '#EFEFEF' },
  Rozwiazane: { color: '#9CA3AF', bg: '#F5F5F5' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

interface Props {
  rozmowy: Rozmowa[];
  onClose: () => void;
  onSelectRecord: (id: string) => void;
}

export default function SearchOverlay({ rozmowy, onClose, onSelectRecord }: Props) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const results = debounced.trim()
    ? rozmowy.filter(r => {
        const q = debounced.toLowerCase();
        return (
          r.imieNazwisko?.toLowerCase().includes(q) ||
          r.nrTelefonu?.toLowerCase().includes(q) ||
          r.temat?.toLowerCase().includes(q) ||
          r.skrot?.toLowerCase().includes(q)
        );
      }).slice(0, 12)
    : [];

  const showEmpty = debounced.trim() && results.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center top-14 sm:top-16"
      onClick={onClose}
    >
      {/* Blur + dim layer */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative mt-8 w-full max-w-[560px] mx-4 h-fit animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Input row */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
            <Search size={18} strokeWidth={2} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Szukaj rozmów…"
              className="flex-1 text-[17px] text-gray-900 placeholder-gray-400 bg-transparent outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 font-mono shrink-0">
              Esc
            </kbd>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <ul className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
              {results.map(r => {
                const s = STATUS_STYLE[r.status];
                return (
                  <li key={r.id}>
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start justify-between gap-4"
                      onClick={() => onSelectRecord(r.id)}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {r.imieNazwisko || '—'}
                        </p>
                        <p className="text-sm text-gray-500 truncate mt-0.5">{r.temat}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ color: s.color, backgroundColor: s.bg }}
                        >
                          {dl(r.status)}
                        </span>
                        {r.dataPołączenia && (
                          <span className="text-xs text-gray-400">
                            {formatDate(r.dataPołączenia)}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {showEmpty && (
            <div className="px-4 py-6 text-sm text-gray-400 text-center">
              Brak rozmów pasujących do zapytania
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
