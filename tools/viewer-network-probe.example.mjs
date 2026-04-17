#!/usr/bin/env node

const VIEWER_PROBE_TARGET = 'https://sp.manga.nicovideo.jp/watch/mg197350';
const DOMAINS_OF_INTEREST = [
  'sp.manga.nicovideo.jp',
  'manga.nicovideo.jp',
  'deliver.cdn.nicomanga.jp',
];

function buildStubReport() {
  return {
    targetUrl: VIEWER_PROBE_TARGET,
    domainsOfInterest: DOMAINS_OF_INTEREST,
    phase: 'viewer-network-interception',
    status: 'stub',
    message:
      'Este é um ponto de entrada executável da próxima fase. A implementação real depende de browser automation com Playwright fora do fluxo atual da Vercel Hobby.',
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

function main() {
  const report = buildStubReport();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main();
