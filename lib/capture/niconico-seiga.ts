export type CaptureChapterInput = {
  url: string;
};

export type CaptureChapterResult = {
  source: 'Nico Nico Seiga';
  requestedUrl: string;
  status: 'pending_parser';
  notes: string[];
};

export function startNicoNicoCapture(input: CaptureChapterInput): CaptureChapterResult {
  return {
    source: 'Nico Nico Seiga',
    requestedUrl: input.url,
    status: 'pending_parser',
    notes: [
      'Base do backend pronta.',
      'Próxima etapa: detectar viewer e payload do capítulo alvo.',
      'Ainda não há captura real de páginas nesta fase inicial.',
    ],
  };
}
