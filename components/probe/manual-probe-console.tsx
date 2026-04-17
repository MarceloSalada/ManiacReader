'use client';

import { useMemo, useState } from 'react';

type ParsedUrl = {
  url: string;
  kind: 'material' | 'thumb' | 'script' | 'watch' | 'api' | 'other';
};

function classifyUrl(url: string): ParsedUrl['kind'] {
  if (/deliver\.cdn\.nicomanga\.jp\/material\//i.test(url)) return 'material';
  if (/deliver\.cdn\.nicomanga\.jp\/thumb\//i.test(url)) return 'thumb';
  if (/ads\.nicovideo\.jp|\/assets\/js\//i.test(url)) return 'script';
  if (/\/watch\//i.test(url)) return 'watch';
  if (/api|viewer|episode|chapters?|frames?|pages?/i.test(url)) return 'api';
  return 'other';
}

function extractUrls(input: string): string[] {
  const matches = input.match(/https?:\/\/[^\s"'<>\\]+/g) ?? [];
  const cleaned = matches
    .map((item) => item.replace(/[),\]}]+$/g, '').replace(/\\+$/g, ''))
    .filter(Boolean)
    .filter((item) => /nicovideo\.jp|nicomanga\.jp/i.test(item));

  return Array.from(new Set(cleaned));
}

export function ManualProbeConsole() {
  const [rawInput, setRawInput] = useState('');

  const parsed = useMemo(() => {
    const urls = extractUrls(rawInput).map((url) => ({ url, kind: classifyUrl(url) }));
    const materials = urls.filter((item) => item.kind === 'material');
    const thumbs = urls.filter((item) => item.kind === 'thumb');
    const apis = urls.filter((item) => item.kind === 'api');
    const watchUrls = urls.filter((item) => item.kind === 'watch');

    return {
      urls,
      materials,
      thumbs,
      apis,
      watchUrls,
    };
  }, [rawInput]);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
      <h2 className="text-xl font-semibold text-white">Console manual do probe</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Cole aqui texto bruto de requests, resposta JSON, HTML, log de rede ou lista de URLs. O app separa os links do ecossistema Nico Nico e destaca candidatos úteis para a próxima fase.
      </p>

      <textarea
        value={rawInput}
        onChange={(event) => setRawInput(event.target.value)}
        rows={10}
        placeholder="Cole aqui URLs, logs ou payloads capturados manualmente..."
        className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400/40"
      />

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">URLs únicas</p>
          <p className="mt-2 text-2xl font-bold text-white">{parsed.urls.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Materials</p>
          <p className="mt-2 text-2xl font-bold text-white">{parsed.materials.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Thumbs</p>
          <p className="mt-2 text-2xl font-bold text-white">{parsed.thumbs.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">APIs / viewer</p>
          <p className="mt-2 text-2xl font-bold text-white">{parsed.apis.length}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h3 className="font-semibold text-white">Candidatos principais</h3>
          <div className="mt-3 space-y-2 text-xs leading-5 text-slate-300 break-all">
            {parsed.materials.length > 0 ? parsed.materials.map((item) => <p key={item.url}>{item.url}</p>) : <p>Nenhum material detectado ainda.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h3 className="font-semibold text-white">Possíveis endpoints úteis</h3>
          <div className="mt-3 space-y-2 text-xs leading-5 text-slate-300 break-all">
            {parsed.apis.length > 0 ? parsed.apis.map((item) => <p key={item.url}>{item.url}</p>) : <p>Nenhum endpoint classificado como api/viewer ainda.</p>}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-slate-300">
        <p>
          Uso prático: quando você conseguir copiar logs, requests ou URLs reais do viewer, cole tudo aqui. Isso não substitui Playwright, mas já ajuda a separar material, thumb e possíveis endpoints sem depender do parser inicial.
        </p>
      </div>
    </section>
  );
}
