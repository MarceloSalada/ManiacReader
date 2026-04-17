import Link from 'next/link';

import { getViewerProbeStubReport } from '@/lib/capture/viewer-network-probe-stub';

export default function ProbePage() {
  const report = getViewerProbeStubReport();

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/" className="text-sm text-slate-300 hover:text-white">
          ← Voltar para a home
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">probe visível no deploy</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Viewer Probe Stub</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">{report.message}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/api/viewer-probe-stub"
              className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/40 hover:bg-emerald-400/15"
            >
              Abrir JSON do probe
            </a>
            <a
              href="/api/viewer-network-runbook"
              className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-slate-900"
            >
              Abrir JSON do runbook
            </a>
            <a
              href="/api/project-status"
              className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-slate-900"
            >
              Abrir JSON do status
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <h2 className="text-xl font-semibold text-white">Alvo inicial</h2>
            <p className="mt-4 break-all text-sm leading-6 text-slate-300">{report.targetUrl}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              <span className="font-semibold text-white">Fase:</span> {report.phase}
            </p>
            <p className="text-sm leading-6 text-slate-300">
              <span className="font-semibold text-white">Status:</span> {report.status}
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <h2 className="text-xl font-semibold text-white">Domínios de interesse</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              {report.domainsOfInterest.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <h2 className="text-xl font-semibold text-white">Próximas ações</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              {report.nextActions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <h2 className="text-xl font-semibold text-white">Formato esperado de saída</h2>
            <p className="mt-4 font-semibold text-white">Requests</p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {report.expectedOutputShape.requests.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <p className="mt-4 font-semibold text-white">Responses</p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
              {report.expectedOutputShape.responses.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5 text-sm leading-6 text-slate-300">
          <p>
            Endpoint desta fase no deploy: <span className="font-semibold text-white">/api/viewer-probe-stub</span>
          </p>
        </div>
      </div>
    </main>
  );
}
