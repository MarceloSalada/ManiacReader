import Link from 'next/link';

import { getViewerNetworkPhaseSummary } from '@/lib/capture/viewer-network-phase';

export default function ViewerNetworkPhasePage() {
  const summary = getViewerNetworkPhaseSummary();

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/" className="text-sm text-slate-300 hover:text-white">
          ← Voltar para a home
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">próxima fase</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Intercepção de rede do viewer</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">{summary.goal}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <h2 className="text-xl font-semibold text-white">Por que isso é necessário</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              {summary.whyItIsNeeded.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <h2 className="text-xl font-semibold text-white">Bloqueios no stack atual</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              {summary.blockersInCurrentStack.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <h2 className="text-xl font-semibold text-white">Capacidades necessárias</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              {summary.requiredCapabilities.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <h2 className="text-xl font-semibold text-white">Saídas esperadas</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              {summary.expectedOutputs.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm leading-6 text-slate-300">
          <p>
            Esta página não finge executar a intercepção. Ela marca formalmente a próxima etapa do projeto e deixa claro
            que o parse do HTML inicial já chegou no limite útil.
          </p>
        </div>
      </div>
    </main>
  );
}
