import type { Status } from '@/types/rozmowa';

export interface StatusDateUpdate {
  dataPrzejecia?: string | null;
  dataZamkniecia?: string | null;
}

export function computeStatusDateFields(
  currentStatus: string,
  newStatus: Status,
  currentDataPrzejecia: string | null | undefined,
  now: string
): StatusDateUpdate {
  if (currentStatus === newStatus) return {};

  const result: StatusDateUpdate = {};

  // Leaving Pilne → stamp dataPrzejecia if not yet set
  if (currentStatus === 'Pilne') {
    if (!currentDataPrzejecia) {
      result.dataPrzejecia = now;
    }
  }

  if (newStatus === 'Rozwiazane') {
    result.dataZamkniecia = now;
  } else if (currentStatus === 'Rozwiazane') {
    result.dataZamkniecia = null;
  }

  return result;
}

export function formatNote(text: string, autor: string, now?: Date): string {
  const d = now ?? new Date();
  const ts = d.toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });
  return `--- [${ts}] ${autor} ---\n${text.trim()}`;
}

export function prependNote(existing: string, entry: string): string {
  return existing ? `${entry}\n\n${existing}` : entry;
}
