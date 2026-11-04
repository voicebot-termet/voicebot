'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { KONSULTANCI } from '@/lib/konsultanci';

const LS_KEY = 'termet_autor';

function loadAutor(): string {
  try { return localStorage.getItem(LS_KEY) ?? ''; } catch { return ''; }
}
function saveAutor(v: string) {
  try { localStorage.setItem(LS_KEY, v); } catch { /* */ }
}

interface Props {
  onConfirm: (note: string, autor?: string) => void;
  onCancel: () => void;
}

export default function NotePopup({ onConfirm, onCancel }: Props) {
  const [note, setNote] = useState('');
  const [autor, setAutor] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setAutor(loadAutor());
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  const handleAutorChange = (v: string) => {
    setAutor(v);
    saveAutor(v);
  };

  const noteHasContent = note.trim().length > 0;
  const canConfirm = !noteHasContent || !!autor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-96 max-w-[calc(100vw-2rem)]"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-gray-900 mb-0.5">Przenieś do W trakcie</h3>
        <p className="text-sm text-gray-400 mb-4">Opcjonalna notatka startowa dla konsultanta:</p>

        <select
          value={autor}
          onChange={e => handleAutorChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 mb-2"
        >
          <option value="">— wybierz konsultanta —</option>
          {KONSULTANCI.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        <textarea
          ref={ref}
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="Notatka (opcjonalnie)…"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        {noteHasContent && !autor && (
          <p className="text-xs text-red-500 mt-1">Wybierz konsultanta, aby dodać notatkę.</p>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => canConfirm && onConfirm(note, autor || undefined)}
            disabled={!canConfirm}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            Zatwierdź <ArrowRight size={15} strokeWidth={2} />
          </button>
          <button
            onClick={onCancel}
            className="px-5 rounded-lg py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
}
