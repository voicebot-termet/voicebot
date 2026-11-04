import { type NextRequest } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { createSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/rate-limit';

function comparePasswords(input: string, expected: string): boolean {
  // Both digests are always 32 bytes — safe for timingSafeEqual
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: 'Zbyt wiele prób logowania. Poczekaj chwilę i spróbuj ponownie.' },
      { status: 429 }
    );
  }

  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    return Response.json({ error: 'Nieprawidłowe żądanie' }, { status: 400 });
  }

  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    console.error('DASHBOARD_PASSWORD env variable is not set');
    return Response.json({ error: 'Błąd konfiguracji serwera' }, { status: 500 });
  }

  if (typeof password !== 'string' || !comparePasswords(password, expected)) {
    return Response.json({ error: 'Nieprawidłowe hasło' }, { status: 401 });
  }

  await createSession();
  return Response.json({ ok: true });
}
