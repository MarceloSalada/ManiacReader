import Link from 'next/link';

const cards = [
  {
    title: 'Importar capítulo',
    description: 'Cole a URL de um capítulo para iniciar a captura experimental no backend.',
    href: '/import',
  },
  {
    title: 'Abrir reader',
    description: 'Entre no leitor para validar navegação, páginas e regiões de balão.',
    href: '/reader',
  },
  {
    title: 'Próxima fase técnica',
    description: 'Veja o plano real para interceptar as requisições do viewer do Nico Nico Manga.',
    href: '/viewer-network-phase',
  },
  {
    title: 'Status do projeto',
    description: 'Veja o que já foi concluído, o que foi fechado e o que ainda falta nesta investigação.',
    href: '/status',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">ManiacReader</p>
          <h1 className="mt-3 text-4xl font-bold text-white">Base limpa para o MangaX 2.0</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
            Este projeto recomeça do zero com foco em backend-first: capturar capítulos, abrir páginas no reader e só depois avançar para OCR e tradução.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 transition hover:border-emerald-400/30 hover:bg-slate-900"
              >
                <h2 className="text-xl font-semibold text-white">{card.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{card.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
