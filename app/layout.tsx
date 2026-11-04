import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dashboard Voicebota — Termet S.A.',
  description: 'Centrum obsługi zgłoszeń z voicebota Termet. Nowoczesne urządzenia grzewcze.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={geist.className}>
      <body>{children}</body>
    </html>
  );
}
