import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    status: 'pending_ocr',
    notes: ['Rota placeholder criada. OCR e tradução entram somente depois de validarmos páginas limpas no reader.'],
  });
}
