'use client';

import { useEffect, useState } from 'react';

function elapsed(from: string): string {
  const diff = Math.floor((Date.now() - new Date(from).getTime()) / 1000);
  if (diff < 0) return '0s';
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function LiveTimer({ from }: { from: string }) {
  const [display, setDisplay] = useState(elapsed(from));

  useEffect(() => {
    setDisplay(elapsed(from));
    const id = setInterval(() => setDisplay(elapsed(from)), 1000);
    return () => clearInterval(id);
  }, [from]);

  return <span>{display}</span>;
}
