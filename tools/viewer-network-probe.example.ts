/*
  Viewer Network Probe (example)

  Finalidade:
  - servir como base da próxima fase real do ManiacReader
  - abrir o viewer do Nico Nico Manga em navegador automatizado
  - interceptar requests/responses relevantes
  - registrar de onde saem frames, imagens ou metadados de leitura

  Observação importante:
  - este arquivo é um exemplo de execução futura
  - ele não é importado pelo app Next.js
  - ele não deve ser tratado como funcional dentro do deploy atual da Vercel Hobby

  Execução futura esperada:
  - ambiente com Playwright instalado
  - execução local ou em ambiente com browser automation real
*/

export type CapturedRequest = {
  url: string;
  method: string;
  resourceType: string;
};

export type CapturedResponse = {
  url: string;
  status: number;
  contentType: string | null;
  excerpt: string | null;
};

export type ViewerProbeReport = {
  targetUrl: string;
  domainsOfInterest: string[];
  requests: CapturedRequest[];
  responses: CapturedResponse[];
  findings: string[];
};

export const VIEWER_PROBE_TARGET = 'https://sp.manga.nicovideo.jp/watch/mg197350';

export const DOMAINS_OF_INTEREST = [
  'sp.manga.nicovideo.jp',
  'manga.nicovideo.jp',
  'deliver.cdn.nicomanga.jp',
];

export async function runViewerNetworkProbeExample(): Promise<ViewerProbeReport> {
  /*
    Implementação futura sugerida com Playwright:

    1. importar chromium de playwright
    2. abrir browser e page
    3. registrar page.on('request')
    4. registrar page.on('response')
    5. navegar para VIEWER_PROBE_TARGET
    6. esperar hidratação do viewer e rolagem inicial
    7. filtrar requests/responses dos domínios de interesse
    8. procurar JSON, payloads ou assets ligados a frames/imagens
    9. gerar relatório final para alimentar o reader
  */

  return {
    targetUrl: VIEWER_PROBE_TARGET,
    domainsOfInterest: DOMAINS_OF_INTEREST,
    requests: [],
    responses: [],
    findings: [
      'Script de exemplo criado.',
      'A implementação real depende de browser automation fora do fluxo atual da Vercel Hobby.',
      'Use este arquivo como ponto de partida da fase de interceptação do viewer.',
    ],
  };
}
