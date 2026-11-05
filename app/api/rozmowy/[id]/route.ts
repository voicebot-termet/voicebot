import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/session';
import { KONSULTANCI } from '@/lib/konsultanci';
import { computeStatusDateFields, formatNote, prependNote } from '@/lib/patch-logic';

const BASE_ID = 'apphb7c8e4ZTKULIH';
const TABLE_ID = 'tbl7zb6qUiafvezi8';
const AIRTABLE_RECORD_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

const AIRTABLE_ID_RE = /^rec[A-Za-z0-9]{14}$/;

const patchSchema = z
  .object({
    status: z.enum(['Pilne', 'W trakcie', 'Rozwiazane']).optional(),
    nowaNotatka: z.string().min(1).max(2000).optional(),
    autor: z.enum(KONSULTANCI).optional(),
  })
  .strict()
  .refine(
    d => (d.nowaNotatka === undefined) === (d.autor === undefined),
    { message: 'nowaNotatka i autor muszą być podane razem' }
  );

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession();
  if (auth) return auth;

  const { id } = await params;

  if (!AIRTABLE_ID_RE.test(id)) {
    return Response.json({ error: 'Nieprawidłowy identyfikator rekordu' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Nieprawidłowe JSON' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Nieprawidłowe dane', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, nowaNotatka, autor } = parsed.data;

  if (status === undefined && nowaNotatka === undefined) {
    return Response.json({ error: 'Brak pól do aktualizacji' }, { status: 400 });
  }

  // Fetch current record before writing — needed for date guards and note prepend
  let currentFields: Record<string, unknown>;
  try {
    const currentRes = await fetch(`${AIRTABLE_RECORD_URL}/${id}`, {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
      cache: 'no-store',
    });
    if (currentRes.status === 404) {
      return Response.json({ error: 'Rekord nie istnieje' }, { status: 404 });
    }
    if (!currentRes.ok) {
      return Response.json({ error: 'Błąd pobierania rekordu' }, { status: 502 });
    }
    const current = await currentRes.json();
    currentFields = current.fields as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Błąd pobierania rekordu' }, { status: 502 });
  }

  const fields: Record<string, unknown> = {};
  const now = new Date().toISOString();

  if (status !== undefined) {
    fields['Status'] = status;

    const currentStatus = currentFields['Status'] as string;
    const currentDataPrzejecia = currentFields['Data przejęcia przez konsultanta'] as string | null | undefined;
    const dates = computeStatusDateFields(currentStatus, status, currentDataPrzejecia, now);

    if (dates.dataPrzejecia !== undefined) {
      fields['Data przejęcia przez konsultanta'] = dates.dataPrzejecia;
    }
    if (dates.dataZamkniecia !== undefined) {
      fields['Data zamknięcia'] = dates.dataZamkniecia;
    }
  }

  if (nowaNotatka !== undefined && autor !== undefined) {
    const existing = (currentFields['Notatki konsultanta'] as string) ?? '';
    fields['Notatki konsultanta'] = prependNote(existing, formatNote(nowaNotatka, autor));
  }

  try {
    const res = await fetch(`${AIRTABLE_RECORD_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const err = await res.json();
      return Response.json({ error: err }, { status: res.status });
    }

    const updated = await res.json();
    return Response.json({ success: true, record: updated });
  } catch (err) {
    console.error(`PATCH /api/rozmowy/${id} error:`, err);
    return Response.json({ error: 'Błąd aktualizacji' }, { status: 500 });
  }
}
