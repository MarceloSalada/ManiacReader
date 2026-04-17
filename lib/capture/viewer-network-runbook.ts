export type ViewerNetworkRunbook = {
  runbookName: string;
  targetEpisodeUrl: string;
  objective: string;
  recommendedEnvironment: string[];
  domainsOfInterest: string[];
  networkSignalsToCapture: string[];
  responseFieldsToLookFor: string[];
  minimumSuccessCriteria: string[];
  outputSchema: {
    requests: string[];
    responseShapes: string[];
    derivedReadingUnits: string[];
  };
};

export function getViewerNetworkRunbook(): ViewerNetworkRunbook {
  return {
    runbookName: 'nico-nico-viewer-network-runbook',
    targetEpisodeUrl: 'https://sp.manga.nicovideo.jp/watch/mg197350',
    objective:
      'Descobrir de quais requisições o viewer já hidratado do Nico Nico Manga obtém os frames, imagens reais ou metadados de corte usados na leitura.',
    recommendedEnvironment: [
      'Browser automation fora do fluxo simples do Vercel Hobby.',
      'Ambiente com suporte real a navegador automatizado e captura de requests/responses.',
      'Execução com Playwright ou ferramenta equivalente.',
    ],
    domainsOfInterest: [
      'sp.manga.nicovideo.jp',
      'manga.nicovideo.jp',
      'deliver.cdn.nicomanga.jp',
    ],
    networkSignalsToCapture: [
      'fetch',
      'XHR',
      'document requests adicionais do viewer',
      'assets do domínio deliver.cdn.nicomanga.jp',
      'respostas JSON ou payloads serializados relacionados ao episódio',
    ],
    responseFieldsToLookFor: [
      'frames',
      'pages',
      'images',
      'viewer payload',
      'scroll metadata',
      'crop metadata',
      'reading order',
    ],
    minimumSuccessCriteria: [
      'Identificar ao menos uma request que dependa do viewer já hidratado.',
      'Encontrar a resposta que represente a leitura real além do HTML inicial.',
      'Conseguir relacionar a resposta com frameCount/player_type já detectados no payload inicial.',
      'Definir a unidade real de leitura: frame, imagem inteira ou imagem com cortes.',
    ],
    outputSchema: {
      requests: [
        'request url',
        'request method',
        'resource type',
        'status code',
        'initiator',
      ],
      responseShapes: [
        'json keys',
        'payload excerpt',
        'image or frame asset urls',
      ],
      derivedReadingUnits: [
        'unit type',
        'count',
        'ordering rule',
        'reader ingestion strategy',
      ],
    },
  };
}
