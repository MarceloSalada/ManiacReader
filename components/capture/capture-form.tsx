'use client';

import { useState } from 'react';

type CaptureResponse = {
  source: string;
  requestedUrl: string;
  status: string;
  notes: string[];
};

export function CaptureForm() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CaptureResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/capture-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? 'Falha ao iniciar a captura.');
        return;
      }

      setResult(payload as CaptureResponse);
    } catch {
      setError('Falha ao chamar a API de captura.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold text-white">Importar capítulo</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Cole a URL de um capítulo do Nico Nico Seiga para iniciar a captura experimental no backend.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <textarea
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          rows={4}
          placeholder="https://seiga.nicovideo.jp/watch/..."
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400/40"
        />

        <button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-200 transition enabled:hover:border-emerald-300/40 enabled:hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? 'Iniciando captura...' : 'Iniciar captura'}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      {result ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
          <p><span className="font-semibold text-white">Fonte:</span> {result.source}</p>
          <p><span className="font-semibold text-white">Status:</span> {result.status}</p>
          <p className="mt-3 font-semibold text-white">Notas</p>
          <ul className="mt-2 space-y-2">
            {result.notes.map((note) => (
              <li key={note}>• {note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
