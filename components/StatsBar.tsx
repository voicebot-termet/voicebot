'use client';

import { Rozmowa } from '@/types/rozmowa';

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5 flex flex-col gap-1 min-w-0">
      <span className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{label}</span>
      <span className="text-xl sm:text-2xl font-bold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-400 truncate">{sub}</span>}
    </div>
  );
}

export default function StatsBar({ rozmowy }: { rozmowy: Rozmowa[] }) {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = rozmowy.filter(r => new Date(r.dataPołączenia).getTime() >= cutoff);

  const totalCalls = recent.length;
  const totalSeconds = recent.reduce((s, r) => s + (r.czasTrwania || 0), 0);
  const resolvedWithoutHuman = recent.filter(r => r.rozwiazaneBezCzlowieka).length;
  const resolvedPct = totalCalls > 0 ? Math.round((resolvedWithoutHuman / totalCalls) * 100) : 0;

  const reactionTimes = rozmowy
    .filter(r => r.czasReakcji !== null && r.czasReakcji > 0)
    .map(r => r.czasReakcji as number);
  const avgReaction =
    reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((s, v) => s + v, 0) / reactionTimes.length)
      : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4">
      <StatCard
        label="Połączenia voicebota (30 dni)"
        value={String(totalCalls)}
        sub="unikalnych rozmów"
      />
      <StatCard
        label="Łączny czas rozmów (30 dni)"
        value={formatDuration(totalSeconds)}
        sub={`${totalSeconds}s łącznie`}
      />
      <StatCard
        label="Rozwiązane bez człowieka"
        value={`${resolvedWithoutHuman}`}
        sub={`${resolvedPct}% z ${totalCalls} rozmów (30 dni)`}
      />
      <StatCard
        label="Śr. czas reakcji konsultanta"
        value={avgReaction !== null ? `${avgReaction} min` : '—'}
        sub="na podstawie wszystkich danych"
      />
    </div>
  );
}
