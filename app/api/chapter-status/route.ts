import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'idle',
    notes: ['Rota placeholder criada. Aqui entraremos depois com status real da captura.'],
  });
}
