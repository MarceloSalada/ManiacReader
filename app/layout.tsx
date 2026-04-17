import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'ManiacReader',
  description: 'Leitor web experimental para captura, leitura e tradução de mangá.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
