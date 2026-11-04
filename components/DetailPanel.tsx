'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, Clock, ExternalLink, X } from 'lucide-react';
import { Rozmowa, Status } from '@/types/rozmowa';
import { KONSULTANCI } from '@/lib/konsultanci';
import LiveTimer from './LiveTimer';

// Display-only label mapping — values sent to Airtable are unchanged
const DISPLAY_LABELS: Record<string, string> = {
  Ogolny: 'Ogólny',
  Rozwiazane: 'Rozwiązane',
};
const dl = (v: string) => DISPLAY_LABELS[v] ?? v;

const LS_KEY = 'termet_autor';

function loadAutor(): string {
  try { return localStorage.getItem(LS_KEY) ?? ''; } catch { return ''; }
}
function saveAutor(v: string) {
  try { localStorage.setItem(LS_KEY, v); } catch { /* */ }
}

interface Props {
  record: Rozmowa;
  onClose: () => void;
  onMoveCard: (id: string, status: Status, note?: string, autor?: string) => Promise<void>;
  onAddNote: (id: string, note: string, autor: string) => Promise<void>;
}

function parseNoteBlocks(raw: string): { header: string; body: string }[] {
  if (!raw.trim()) return [];
  return raw
    .split(/\n\n+/)
    .filter(b => b.trim())
    .map(block => {
      const lines = block.trim().split('\n');
      if (lines[0].startsWith('---')) {
        return {
          header: lines[0].replace(/---/g, '').trim(),
          body: lines.slice(1).join('\n').trim(),
        };
      }
      return { header: '', body: block.trim() };
    });
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', {
    timeZone: 'Europe/Warsaw',
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

const INPUT_CLS =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400';
const BTN_BLACK =
  'rounded-lg px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 transition-colors';

export default function DetailPanel({ record, onClose, onMoveCard, onAddNote }: Props) {
  const [noteText, setNoteText] = useState('');
  const [autor, setAutor] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNoteText('');
    setAutor(loadAutor());
  }, [record.id]);

  const handleAutorChange = (v: string) => {
    setAutor(v);
    saveAutor(v);
  };

  const handleMoveToWTrakcie = async () => {
    setBusy(true);
    const note = noteText.trim() || undefined;
    const autorVal = note && autor ? autor : undefined;
    await onMoveCard(record.id, 'W trakcie', note, autorVal);
    setNoteText('');
    setBusy(false);
  };

  const handleCloseCase = async () => {
    setBusy(true);
    await onMoveCard(record.id, 'Rozwiazane');
    setBusy(false);
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !autor) return;
    setBusy(true);
    await onAddNote(record.id, noteText.trim(), autor);
    setNoteText('');
    setBusy(false);
  };

  const noteBlocks = parseNoteBlocks(record.notatkiKonsultanta);
  const noteHasContent = noteText.trim().length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900 leading-tight">{record.imieNazwisko || '—'}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{record.nrTelefonu}</p>
          {record.specjalista && (
            <span className="mt-1.5 inline-block text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {dl(record.specjalista)}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors mt-0.5"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">

        {/* Timer — Pilne only */}
        {record.status === 'Pilne' && record.dataPołączenia && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C00D0E] bg-red-50 rounded-lg px-3 py-2">
            <Clock size={13} strokeWidth={2} />
            Czas od zgłoszenia: <LiveTimer from={record.dataPołączenia} />
          </div>
        )}

        {/* Temat */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Temat</p>
          <p className="text-sm text-gray-800">{record.temat || '—'}</p>
        </div>

        {/* Skrót rozmowy */}
        {record.skrot && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Skrót rozmowy</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 leading-relaxed">
              {record.skrot}
            </p>
          </div>
        )}

        {/* Sugerowane działanie */}
        {record.sugerowaneAkcje && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Sugerowane działanie</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-200 leading-relaxed">
              {record.sugerowaneAkcje}
            </p>
          </div>
        )}

        {/* Transkrypcja */}
        {record.linkTranskrypcji && (
          <a
            href={record.linkTranskrypcji}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 underline underline-offset-2"
          >
            <ExternalLink size={14} strokeWidth={2} />
            Otwórz transkrypcję
          </a>
        )}

        {/* Metadata grid */}
        {(record.dataPrzejecia || record.dataZamkniecia || record.czasReakcji || record.czasRozwiazania) && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {record.dataPrzejecia && (
              <div>
                <p className="text-gray-400">Przejęto</p>
                <p className="text-gray-700 font-medium">{fmt(record.dataPrzejecia)}</p>
              </div>
            )}
            {record.dataZamkniecia && (
              <div>
                <p className="text-gray-400">Zamknięto</p>
                <p className="text-gray-700 font-medium">{fmt(record.dataZamkniecia)}</p>
              </div>
            )}
            {record.czasReakcji !== null && (
              <div>
                <p className="text-gray-400">Czas reakcji</p>
                <p className="text-gray-700 font-medium">{record.czasReakcji} min</p>
              </div>
            )}
            {record.czasRozwiazania !== null && (
              <div>
                <p className="text-gray-400">Czas rozwiązania</p>
                <p className="text-gray-700 font-medium">{record.czasRozwiazania} min</p>
              </div>
            )}
          </div>
        )}

        {/* W trakcie: add note + history */}
        {record.status === 'W trakcie' && (
          <>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-600">Dodaj notatkę</p>
              <select
                value={autor}
                onChange={e => handleAutorChange(e.target.value)}
                onClick={e => e.stopPropagation()}
                className={INPUT_CLS}
              >
                <option value="">— wybierz konsultanta —</option>
                {KONSULTANCI.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <textarea
                placeholder="Treść notatki…"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onClick={e => e.stopPropagation()}
                rows={3}
                className={`${INPUT_CLS} resize-none`}
              />
              {noteHasContent && !autor && (
                <p className="text-xs text-red-500">Wybierz konsultanta, aby dodać notatkę.</p>
              )}
              <button
                onClick={e => { e.stopPropagation(); handleAddNote(); }}
                disabled={busy || !noteText.trim() || !autor}
                className={BTN_BLACK}
              >
                {busy ? 'Zapisywanie…' : 'Dodaj notatkę'}
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Historia notatek</p>
              {noteBlocks.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Brak notatek</p>
              ) : (
                <div className="space-y-2">
                  {noteBlocks.map((b, i) => (
                    <div key={i} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                      {b.header && <p className="text-xs text-gray-400 mb-1">{b.header}</p>}
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{b.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Rozwiązane: read-only notes */}
        {record.status === 'Rozwiazane' && noteBlocks.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Notatki</p>
            <div className="space-y-2">
              {noteBlocks.map((b, i) => (
                <div key={i} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  {b.header && <p className="text-xs text-gray-400 mb-1">{b.header}</p>}
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Action footer ── */}
      {record.status === 'Pilne' && (
        <div
          className="shrink-0 border-t border-gray-100 px-5 py-4 space-y-2"
          onClick={e => e.stopPropagation()}
        >
          <select
            value={autor}
            onChange={e => handleAutorChange(e.target.value)}
            className={INPUT_CLS}
          >
            <option value="">— wybierz konsultanta —</option>
            {KONSULTANCI.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <textarea
            placeholder="Notatka startowa (opcjonalnie)…"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={2}
            className={`${INPUT_CLS} resize-none`}
          />
          {noteHasContent && !autor && (
            <p className="text-xs text-red-500">Wybierz konsultanta, aby dodać notatkę.</p>
          )}
          <button
            onClick={handleMoveToWTrakcie}
            disabled={busy || (noteHasContent && !autor)}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {busy ? 'Przenoszenie…' : (
              <>Przenieś do W trakcie <ArrowRight size={15} strokeWidth={2} /></>
            )}
          </button>
        </div>
      )}

      {record.status === 'W trakcie' && (
        <div
          className="shrink-0 border-t border-gray-100 px-5 py-4"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={handleCloseCase}
            disabled={busy}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            <Check size={15} strokeWidth={2.5} />
            {busy ? 'Zamykanie…' : 'Zamknij sprawę'}
          </button>
        </div>
      )}
    </div>
  );
}
