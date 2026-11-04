'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, Search, LogOut } from 'lucide-react';
import { Rozmowa, Status, PatchPayload } from '@/types/rozmowa';
import { formatNote, prependNote, computeStatusDateFields } from '@/lib/patch-logic';
import StatsBar from '@/components/StatsBar';
import KanbanBoard from '@/components/KanbanBoard';
import DetailPanel from '@/components/DetailPanel';
import SearchOverlay from '@/components/SearchOverlay';

const BRAND = '#C00D0E';
const POLL_MS = 15_000;

export default function Dashboard() {
  const router = useRouter();
  const [rozmowy, setRozmowy] = useState<Rozmowa[]>([]);
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const rozmowyRef = useRef<Rozmowa[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { rozmowyRef.current = rozmowy; }, [rozmowy]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/rozmowy');
      if (res.status === 401) { router.replace('/login'); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRozmowy(data.rozmowy ?? []);
      setLastUpdated(new Date());
      setConnError(null);
    } catch (e) {
      setConnError('Błąd połączenia');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(prev => { if (prev) return false; setSelectedId(null); return false; });
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── moveCard — single entry point for all status changes ──────────────────
  const moveCard = useCallback(async (
    recordId: string,
    newStatus: Status,
    note?: string,
    autor?: string
  ) => {
    const record = rozmowyRef.current.find(r => r.id === recordId);
    if (!record) return;

    const oldRecord = { ...record };
    const now = new Date().toISOString();
    const payload: PatchPayload = { status: newStatus };
    const optimistic: Partial<Rozmowa> = { status: newStatus };

    // Mirror server date logic optimistically
    const dates = computeStatusDateFields(oldRecord.status, newStatus, oldRecord.dataPrzejecia, now);
    if (dates.dataPrzejecia !== undefined) optimistic.dataPrzejecia = dates.dataPrzejecia;
    if (dates.dataZamkniecia !== undefined) optimistic.dataZamkniecia = dates.dataZamkniecia;

    if (note?.trim() && autor) {
      payload.nowaNotatka = note.trim();
      payload.autor = autor;
      optimistic.notatkiKonsultanta = prependNote(
        oldRecord.notatkiKonsultanta,
        formatNote(note.trim(), autor)
      );
    }

    // Optimistic UI
    setRozmowy(prev => prev.map(r => r.id === recordId ? { ...r, ...optimistic } : r));

    try {
      const res = await fetch(`/api/rozmowy/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) { router.replace('/login'); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('moveCard failed:', err);
      setRozmowy(prev => prev.map(r => r.id === recordId ? oldRecord : r));
      setActionError('Nie udało się przenieść karty. Spróbuj ponownie.');
      setTimeout(() => setActionError(null), 5000);
    }
  }, [router]);

  // ── addNote — append note without status change ────────────────────────────
  const addNote = useCallback(async (
    recordId: string,
    noteText: string,
    autor: string
  ) => {
    const record = rozmowyRef.current.find(r => r.id === recordId);
    if (!record || !noteText.trim() || !autor) return;

    const merged = prependNote(record.notatkiKonsultanta, formatNote(noteText.trim(), autor));
    setRozmowy(prev =>
      prev.map(r => r.id === recordId ? { ...r, notatkiKonsultanta: merged } : r)
    );

    try {
      const res = await fetch(`/api/rozmowy/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nowaNotatka: noteText.trim(), autor }),
      });
      if (res.status === 401) { router.replace('/login'); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('addNote failed:', err);
      setRozmowy(prev =>
        prev.map(r => r.id === recordId ? { ...r, notatkiKonsultanta: record.notatkiKonsultanta } : r)
      );
    }
  }, [router]);

  // ── Card selection ─────────────────────────────────────────────────────────
  const handleSelectCard = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedId(prev => (prev === id ? null : id));
  }, []);

  const selectedRecord = rozmowy.find(r => r.id === selectedId) ?? null;

  return (
    <div className="h-screen flex flex-col bg-[#F7F6F4] overflow-hidden">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 shrink-0 z-10">
        <div className="px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Image
              src="/logo.png"
              alt="Termet S.A."
              width={100}
              height={24}
              className="object-contain shrink-0 w-[90px] sm:w-[120px] h-auto"
              priority
            />
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-semibold text-gray-800 leading-tight truncate">Dashboard Voicebota</p>
              <p className="text-xs text-gray-400 leading-tight truncate">Centrum obsługi zgłoszeń</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
            {actionError && (
              <span className="hidden sm:inline text-red-500 font-medium bg-red-50 px-2 py-1 rounded-lg">{actionError}</span>
            )}
            {connError ? (
              <span className="flex items-center gap-1 text-red-500 font-medium">
                <AlertCircle size={13} strokeWidth={2} />
                <span className="hidden sm:inline">{connError}</span>
              </span>
            ) : lastUpdated && (
              <span className="hidden sm:inline text-gray-400">Odświeżono: {lastUpdated.toLocaleTimeString('pl-PL')}</span>
            )}
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: connError ? '#EF4444' : '#22C55E' }}
            />
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors"
              title="Szukaj (⌘K)"
            >
              <Search size={15} strokeWidth={2} />
            </button>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.replace('/login');
              }}
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors"
              title="Wyloguj"
            >
              <LogOut size={15} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0">
        <StatsBar rozmowy={rozmowy} />
      </div>

      {/* ── Board + Panel ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Board — click on bg closes panel */}
        <div
          className="flex-1 min-w-0 overflow-hidden px-3 sm:px-6 pb-3 sm:pb-6"
          onClick={() => setSelectedId(null)}
        >
          {loading && !lastUpdated ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: `${BRAND} transparent transparent transparent` }}
                />
                <span className="text-sm">Pobieranie danych…</span>
              </div>
            </div>
          ) : (
            <KanbanBoard
              rozmowy={rozmowy}
              onMoveCard={moveCard}
              onSelectCard={handleSelectCard}
              selectedId={selectedId}
            />
          )}
        </div>

        {searchOpen && (
          <SearchOverlay
            rozmowy={rozmowy}
            onClose={() => setSearchOpen(false)}
            onSelectRecord={id => { setSelectedId(id); setSearchOpen(false); }}
          />
        )}

        {/* Slide-in panel (desktop) — takes width in flow, board compresses */}
        <div
          className="hidden md:block shrink-0 border-l border-gray-200 bg-white overflow-hidden transition-all duration-300 ease-in-out"
          style={{ width: selectedRecord ? 400 : 0 }}
          onClick={e => e.stopPropagation()}
        >
          {selectedRecord && (
            <div className="w-[400px] h-full">
              <DetailPanel
                key={selectedRecord.id}
                record={selectedRecord}
                onClose={() => setSelectedId(null)}
                onMoveCard={moveCard}
                onAddNote={addNote}
              />
            </div>
          )}
        </div>

        {/* Full-screen panel (mobile) */}
        {selectedRecord && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-white"
            onClick={e => e.stopPropagation()}
          >
            <DetailPanel
              key={selectedRecord.id}
              record={selectedRecord}
              onClose={() => setSelectedId(null)}
              onMoveCard={moveCard}
              onAddNote={addNote}
            />
          </div>
        )}
      </div>
    </div>
  );
}
