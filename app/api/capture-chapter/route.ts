import { NextResponse } from 'next/server';

import { startNicoNicoCapture } from '@/lib/capture/niconico-seiga';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const requestedUrl = body.url?.trim() ?? '';

    if (!requestedUrl) {
      return NextResponse.json({ error: 'A URL do capítulo é obrigatória.' }, { status: 400 });
    }

    const result = startNicoNicoCapture({ url: requestedUrl });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Falha ao iniciar a captura.' }, { status: 500 });
  }
}
