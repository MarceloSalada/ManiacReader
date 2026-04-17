export type ViewerProbeStubReport = {
  targetUrl: string;
  domainsOfInterest: string[];
  phase: string;
  status: 'stub';
  message: string;
  nextActions: string[];
  expectedOutputShape: {
    requests: string[];
    responses: string[];
  };
};

export function getViewerProbeStubReport(): ViewerProbeStubReport {
  return {
    targetUrl: 'https://sp.manga.nicovideo.jp/watch/mg197350',
    domainsOfInterest: [
      'sp.manga.nicovideo.jp',
      'manga.nicovideo.jp',
      'deliver.cdn.nicomanga.jp',
    ],
    phase: 'viewer-network-interception',
    status: 'stub',
    message:
      'Este stub já pode ser visto no deploy da Vercel, mas a interceptação real ainda depende de browser automation com Playwright fora do fluxo atual da Vercel Hobby.',
    nextActions: [
      'Instalar Playwright em ambiente apropriado.',
      'Abrir a URL do episódio em navegador automatizado.',
      'Capturar requests e responses após hidratação do viewer.',
      'Identificar a origem real dos frames, imagens ou metadados de corte.',
    ],
    expectedOutputShape: {
      requests: ['url', 'method', 'resourceType', 'status'],
      responses: ['contentType', 'payloadExcerpt', 'derivedReadingUnits'],
    },
  };
}
