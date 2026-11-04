import { describe, it, expect } from 'vitest';
import { computeStatusDateFields, formatNote, prependNote } from '../patch-logic';

const NOW = '2026-10-30T10:00:00.000Z';
const NOW_DATE = new Date(NOW);

describe('computeStatusDateFields', () => {
  it('Pilne → Rozwiazane: stamps both dates', () => {
    const r = computeStatusDateFields('Pilne', 'Rozwiazane', null, NOW);
    expect(r.dataPrzejecia).toBe(NOW);
    expect(r.dataZamkniecia).toBe(NOW);
  });

  it('Pilne → Rozwiazane: skips dataPrzejecia when already set', () => {
    const r = computeStatusDateFields('Pilne', 'Rozwiazane', '2026-10-01T08:00:00.000Z', NOW);
    expect(r.dataPrzejecia).toBeUndefined();
    expect(r.dataZamkniecia).toBe(NOW);
  });

  it('Rozwiazane → W trakcie: clears dataZamkniecia', () => {
    const r = computeStatusDateFields('Rozwiazane', 'W trakcie', '2026-10-01T08:00:00.000Z', NOW);
    expect(r.dataZamkniecia).toBeNull();
    expect(r.dataPrzejecia).toBeUndefined();
  });

  it('Rozwiazane → Rozwiazane: no-op (same status)', () => {
    const r = computeStatusDateFields('Rozwiazane', 'Rozwiazane', null, NOW);
    expect(r).toEqual({});
  });

  it('W trakcie → Rozwiazane: stamps dataZamkniecia only', () => {
    const r = computeStatusDateFields('W trakcie', 'Rozwiazane', '2026-10-01T08:00:00.000Z', NOW);
    expect(r.dataZamkniecia).toBe(NOW);
    expect(r.dataPrzejecia).toBeUndefined();
  });

  it('Pilne → W trakcie: stamps dataPrzejecia when empty', () => {
    const r = computeStatusDateFields('Pilne', 'W trakcie', null, NOW);
    expect(r.dataPrzejecia).toBe(NOW);
    expect(r.dataZamkniecia).toBeUndefined();
  });
});

describe('formatNote', () => {
  it('includes autor and text in correct format', () => {
    const result = formatNote('Klient oddzwonił', 'Anna Kowalska', NOW_DATE);
    expect(result).toMatch(/^--- \[.+\] Anna Kowalska ---\nKlient oddzwonił$/);
  });

  it('trims whitespace from text', () => {
    const result = formatNote('  tekst  ', 'Piotr Nowak', NOW_DATE);
    expect(result).toMatch(/---\ntekst$/);
  });
});

describe('prependNote', () => {
  it('prepends to existing notes with blank line separator', () => {
    const result = prependNote('stara notatka', 'nowa notatka');
    expect(result).toBe('nowa notatka\n\nstara notatka');
  });

  it('returns entry alone when existing is empty', () => {
    expect(prependNote('', 'nowa')).toBe('nowa');
  });
});
