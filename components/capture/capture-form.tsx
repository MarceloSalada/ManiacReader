'use client';

import Link from 'next/link';
import { useState } from 'react';

type CaptureResponse = {
  source: string;
  requestedUrl: string;
  normalizedUrl: string;
  status: string;
  title: string | null;
  description: string | null;
  signals: string[];
  scriptSnippetCount: number;
  scriptSnippets: string[];
  endpointCandidates: string[];
  comicId: string | null;
  episodeId: string | null;
  materialCandidates: string[];
  candidateMaterialCount: number;
  frameCount: number | null;
  playerType: string | null;
  contentSnippet: string | null;
  pageFieldSignals: string[];
  investigationComplete: boolean;
  diagnosisSummary: string;
  nextRequiredStep: string;
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
        setError(payload.error ?? payload.notes?.[0] ?? 'Falha ao iniciar a captura.');
        return;
      }

      setResult(payload as CaptureResponse);
    } catch {
      setError('Falha ao chamar a API de captura.');
    } finally {
      setIsLoading(false);
    }
  }

  const probeHref = result
    ? `/probe?targetUrl=${encodeURIComponent(result.normalizedUrl)}&comicId=${encodeURIComponent(result.comicId ?? '')}&episodeId=${encodeURIComponent(result.episodeId ?? '')}&playerType=${encodeURIComponent(result.playerType ?? '')}&frameCount=${encodeURIComponent(String(result.frameCount ?? ''))}`
    : '/probe';

  const readerHref = result?.episodeId ? `/reader?episodeId=${encodeURIComponent(result.episodeId)}` : '/reader';

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold text-white">Importar capítulo</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Cole a URL de um capítulo do Nico Nico Seiga ou Nico Nico Manga para iniciar a inspeção experimental do backend.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <textarea
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          rows={4}
          placeholder="https://sp.manga.nicovideo.jp/episode/..."
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400/40"
        />

        <button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-200 transition enabled:hover:border-emerald-300/40 enabled:hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? 'Inspecionando capítulo...' : 'Iniciar captura'}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      {result ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
            <p><span className="font-semibold text-white">Diagnóstico final desta fase:</span> {result.diagnosisSummary}</p>
            <p className="mt-2"><span className="font-semibold text-white">Próximo passo obrigatório:</span> {result.nextRequiredStep}</p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={probeHref}
                className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/40 hover:bg-emerald-400/15"
              >
                Ir para o probe
              </Link>
              <Link
                href={readerHref}
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-slate-900"
              >
                Abrir reader do episódio
              </Link>
              <a
                href="/api/viewer-probe-stub"
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-slate-900"
              >
                Abrir JSON do probe
              </a>
            </div>
          </div>

          <p className="mt-4"><span className="font-semibold text-white">Fonte:</span> {result.source}</p>
          <p><span className="font-semibold text-white">Status:</span> {result.status}</p>
          <p><span className="font-semibold text-white">Investigação concluída:</span> {result.investigationComplete ? 'Sim' : 'Não'}</p>
          <p><span className="font-semibold text-white">URL normalizada:</span> {result.normalizedUrl}</p>
          <p className="mt-3"><span className="font-semibold text-white">Título:</span> {result.title ?? 'Não detectado'}</p>
          <p><span className="font-semibold text-white">Descrição:</span> {result.description ?? 'Não detectada'}</p>

          <p className="mt-4 font-semibold text-white">IDs detectados</p>
          <p><span className="font-semibold text-white">Comic ID:</span> {result.comicId ?? 'Não detectado'}</p>
          <p><span className="font-semibold text-white">Episode ID:</span> {result.episodeId ?? 'Não detectado'}</p>
          <p><span className="font-semibold text-white">Player type:</span> {result.playerType ?? 'Não detectado'}</p>
          <p><span className="font-semibold text-white">Frame count:</span> {result.frameCount ?? 'Não detectado'}</p>
          <p><span className="font-semibold text-white">Materiais candidatos iniciais:</span> {result.candidateMaterialCount}</p>

          <p className="mt-4 font-semibold text-white">Sinais detectados</p>
          {result.signals.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {result.signals.map((signal) => (
                <li key={signal}>• {signal}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">Nenhum sinal detectado ainda.</p>
          )}

          <p className="mt-4 font-semibold text-white">Sinais de campos de página</p>
          {result.pageFieldSignals.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {result.pageFieldSignals.map((signal) => (
                <li key={signal}>• {signal}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">Nenhum campo ligado a páginas apareceu ainda no trecho content.</p>
          )}

          <p className="mt-4 font-semibold text-white">Trecho do bloco content</p>
          {result.contentSnippet ? (
            <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5 break-all text-slate-300">
              {result.contentSnippet}
            </div>
          ) : (
            <p className="mt-2">Nenhum trecho content foi extraído ainda.</p>
          )}

          <details className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3">
            <summary className="cursor-pointer font-semibold text-white">Ver detalhes técnicos</summary>

            <p className="mt-4 font-semibold text-white">Scripts relevantes</p>
            <p className="mt-2">{result.scriptSnippetCount}</p>
            {result.scriptSnippets.length > 0 ? (
              <div className="mt-3 space-y-3 text-xs leading-5 text-slate-300">
                {result.scriptSnippets.map((snippet, index) => (
                  <div key={`${index}-${snippet}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    {snippet}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2">Nenhum script relevante isolado ainda.</p>
            )}

            <p className="mt-4 font-semibold text-white">Possíveis endpoints</p>
            {result.endpointCandidates.length > 0 ? (
              <div className="mt-2 space-y-2 break-all text-xs leading-5 text-slate-300">
                {result.endpointCandidates.map((endpoint) => (
                  <p key={endpoint}>{endpoint}</p>
                ))}
              </div>
            ) : (
              <p className="mt-2">Nenhum endpoint candidato detectado ainda.</p>
            )}

            <p className="mt-4 font-semibold text-white">Materiais candidatos do episódio</p>
            {result.materialCandidates.length > 0 ? (
              <div className="mt-2 space-y-2 break-all text-xs leading-5 text-slate-300">
                {result.materialCandidates.slice(0, 20).map((material) => (
                  <p key={material}>{material}</p>
                ))}
                {result.materialCandidates.length > 20 ? (
                  <p>Mostrando 20 de {result.materialCandidates.length} materiais.</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2">Nenhum material candidato detectado ainda.</p>
            )}

            <p className="mt-4 font-semibold text-white">Notas</p>
            <ul className="mt-2 space-y-2">
              {result.notes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </details>
        </div>
      ) : null}
    </div>
  );
}
