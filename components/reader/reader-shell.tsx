import type { MangaChapter } from '@/lib/reader/types';

const sampleChapter: MangaChapter = {
  id: 'sample-chapter',
  title: 'Capítulo de exemplo',
  pages: [
    {
      id: 'sample-page-1',
      imageUrl: 'https://placehold.co/1200x1800/0f172a/e2e8f0?text=Pagina+1',
      alt: 'Página de exemplo 1',
    },
  ],
};

export function ReaderShell() {
  const page = sampleChapter.pages[0];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">reader</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{sampleChapter.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Este é o shell inicial do leitor. Aqui vamos validar páginas limpas, navegação e regiões antes de ligar OCR e tradução.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-2xl shadow-black/20">
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">
          Área inicial do reader pronta para conectar capítulos capturados no backend.
        </div>

        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-3">
          <img src={page.imageUrl} alt={page.alt} className="h-auto w-full rounded-xl object-contain" />
        </div>
      </div>
    </div>
  );
}
