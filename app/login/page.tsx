'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.replace('/');
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setError(data.error ?? 'Zbyt wiele prób. Poczekaj chwilę.');
      } else {
        setError(data.error ?? 'Nieprawidłowe hasło');
      }
    } catch {
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F6F4] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.png"
            alt="Termet S.A."
            width={120}
            height={29}
            className="object-contain"
            priority
          />
        </div>

        <h1 className="text-sm font-semibold text-gray-800 text-center mb-1">
          Dashboard Voicebota
        </h1>
        <p className="text-xs text-gray-400 text-center mb-6">
          Centrum obsługi zgłoszeń
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-600 mb-1">
              Hasło
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#C00D0E] focus:ring-1 focus:ring-[#C00D0E] transition-colors"
              placeholder="Wprowadź hasło"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-lg py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#C00D0E' }}
          >
            {loading ? 'Logowanie…' : 'Zaloguj'}
          </button>
        </form>
      </div>
    </div>
  );
}
