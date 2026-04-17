import Link from 'next/link';

import { ReaderShell } from '@/components/reader/reader-shell';

export default function ReaderPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/" className="text-sm text-slate-300 hover:text-white">
          ← Voltar para a home
        </Link>
        <ReaderShell />
      </div>
    </main>
  );
}
