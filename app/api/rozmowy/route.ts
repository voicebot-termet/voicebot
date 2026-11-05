import { Rozmowa } from '@/types/rozmowa';
import { requireSession } from '@/lib/session';

const BASE_ID = 'apphb7c8e4ZTKULIH';
const TABLE_ID = 'tbl7zb6qUiafvezi8';
const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

function mapRecord(record: {
  id: string;
  fields: Record<string, unknown>;
}): Rozmowa {
  const f = record.fields;
  return {
    id: record.id,
    idRozmowy: (f['ID rozmowy'] as string) ?? '',
    imieNazwisko: (f['Imię i nazwisko'] as string) ?? '',
    nrTelefonu: (f['Numer telefonu'] as string) ?? '',
    specjalista: (f['Specjalista / obszar'] as string) ?? '',
    temat: (f['Temat rozmowy'] as string) ?? '',
    status: (f['Status'] as Rozmowa['status']) ?? 'Pilne (czerwony)',
    dataPołączenia: (f['Data i godzina połączenia'] as string) ?? '',
    czasTrwania: (f['Czas trwania rozmowy (s)'] as number) ?? 0,
    skrot: (f['Skrót rozmowy'] as string) ?? '',
    sugerowaneAkcje: (f['Sugerowane działanie'] as string) ?? '',
    linkTranskrypcji: (f['Link do transkrypcji'] as string) ?? '',
    dataPrzejecia: (f['Data przejęcia przez konsultanta'] as string) ?? null,
    notatkiKonsultanta: (f['Notatki konsultanta'] as string) ?? '',
    przypisanyKonsultant: (f['Przypisany konsultant'] as string) ?? '',
    dataZamkniecia: (f['Data zamknięcia'] as string) ?? null,
    rozwiazaneBezCzlowieka: Boolean(f['Rozwiązane bez człowieka']),
    czasReakcji: (f['Czas reakcji (min)'] as number) ?? null,
    czasRozwiazania: (f['Czas rozwiązania (min)'] as number) ?? null,
  };
}

async function fetchAllRecords(): Promise<Rozmowa[]> {
  const records: Rozmowa[] = [];
  let offset: string | undefined = undefined;

  do {
    const url = new URL(AIRTABLE_URL);
    url.searchParams.set('sort[0][field]', 'Data i godzina połączenia');
    url.searchParams.set('sort[0][direction]', 'desc');
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);

    const data = await res.json();
    records.push(...data.records.map(mapRecord));
    offset = data.offset;
  } while (offset);

  return records;
}

export async function GET() {
  const auth = await requireSession();
  if (auth) return auth;

  try {
    const rozmowy = await fetchAllRecords();
    return Response.json({ rozmowy });
  } catch (err) {
    console.error('GET /api/rozmowy error:', err);
    return Response.json({ error: 'Błąd pobierania danych' }, { status: 500 });
  }
}
