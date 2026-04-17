export type CaptureChapterInput = {
  url: string;
};

export type CaptureChapterResult = {
  source: 'Nico Nico';
  requestedUrl: string;
  normalizedUrl: string;
  status: 'invalid_url' | 'inspected' | 'pending_parser';
  title: string | null;
  description: string | null;
  signals: string[];
  scriptSnippetCount: number;
  scriptSnippets: string[];
  endpointCandidates: string[];
  comicId: string | null;
  episodeId: string | null;
  materialCandidates: string[];
  candidateMaterialCount: number;
  frameCount: number | null;
  playerType: string | null;
  contentSnippet: string | null;
  pageFieldSignals: string[];
  notes: string[];
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractMetaContent(html: string, propertyName: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${propertyName}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${propertyName}["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+name=["']${propertyName}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${propertyName}["'][^>]*>`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1]);
    }
  }

  return null;
}

function extractScriptSnippets(html: string, maxCount = 8) {
  const matches = Array.from(html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi));
  const relevant = matches
    .map((match) => match[1]?.trim() ?? '')
    .filter(Boolean)
    .filter((script) => /episode|viewer|canvas|image|img|comic|manga|watch|api|json|material|__next_f|content/i.test(script))
    .slice(0, maxCount)
    .map((script) => script.replace(/\s+/g, ' ').slice(0, 1200));

  return {
    total: relevant.length,
    snippets: relevant,
  };
}

function extractEndpointCandidates(html: string, maxCount = 16) {
  const patterns = [
    /https?:\/\/[^"'\s]+(?:api|viewer|episode|episodes|image|images|comic|manga|json|material)[^"'\s]*/gi,
    /\/[^"'\s]+(?:api|viewer|episode|episodes|image|images|comic|manga|json|material)[^"'\s]*/gi,
  ];

  const found = patterns.flatMap((pattern) => Array.from(html.matchAll(pattern)).map((match) => match[0]));
  return Array.from(new Set(found)).slice(0, maxCount);
}

function extractIds(html: string) {
  const decoded = decodeHtmlEntities(html);
  const comicMatch =
    decoded.match(/https:\/\/manga\.nicovideo\.jp\/comic\/(\d+)/i) ?? decoded.match(/"id":(\d+)/i);
  const episodeMatch = decoded.match(/\["episodeId","([^"]+)"/i) ?? decoded.match(/watch\/(mg\d+)/i);

  return {
    comicId: comicMatch?.[1] ?? null,
    episodeId: episodeMatch?.[1] ?? null,
  };
}

function extractMaterialCandidates(html: string, maxCount = 120) {
  const decoded = decodeHtmlEntities(html).replace(/\\\//g, '/');
  const pattern = /https:\/\/deliver\.cdn\.nicomanga\.jp\/material\/[^"'\s,\\]+/gi;
  const found = Array.from(decoded.matchAll(pattern)).map((match) => match[0].replace(/\\$/g, ''));
  return Array.from(new Set(found)).slice(0, maxCount);
}

function extractContentSnippet(html: string, scriptSnippets: string[]) {
  const decoded = decodeHtmlEntities(html).replace(/\\\//g, '/');

  const directMarkers = ['"content":{', '\\"content\\":{'];
  for (const marker of directMarkers) {
    const index = decoded.indexOf(marker);
    if (index !== -1) {
      return decoded.slice(index, index + 4200).replace(/\s+/g, ' ');
    }
  }

  for (const snippet of scriptSnippets) {
    const normalizedSnippet = decodeHtmlEntities(snippet).replace(/\\\//g, '/');
    const directIndex = normalizedSnippet.indexOf('"content":{');
    if (directIndex !== -1) {
      return normalizedSnippet.slice(directIndex, directIndex + 3200).replace(/\s+/g, ' ');
    }

    const escapedIndex = normalizedSnippet.indexOf('\\"content\\":{');
    if (escapedIndex !== -1) {
      return normalizedSnippet.slice(escapedIndex, escapedIndex + 3200).replace(/\s+/g, ' ');
    }
  }

  return null;
}

function extractPageFieldSignals(snippet: string | null) {
  if (!snippet) {
    return [];
  }

  const fieldPatterns: Array<[string, RegExp]> = [
    ['page', /\\?"page\\?"/i],
    ['pages', /\\?"pages\\?"/i],
    ['pageCount', /pageCount|page_count|totalPage|total_page/i],
    ['image', /\\?"image\\?"|\\?"images\\?"|imageUrl|image_url/i],
    ['material', /\\?"material\\?"|materials/i],
    ['viewer', /viewer/i],
    ['canvas', /canvas/i],
    ['frame', /\\?"frame\\?"|counter\\?":\\?\{[^}]*\\?"frame\\?"/i],
    ['playerType', /player_type/i],
  ];

  return fieldPatterns.filter(([, pattern]) => pattern.test(snippet)).map(([label]) => label);
}

function extractFrameCount(snippet: string | null) {
  if (!snippet) {
    return null;
  }

  const patterns = [
    /counter\\?":\\?\{[^}]*\\?"frame\\?":(\d+)/i,
    /\\?"frame\\?":(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match?.[1]) {
      return Number(match[1]);
    }
  }

  return null;
}

function extractPlayerType(snippet: string | null) {
  if (!snippet) {
    return null;
  }

  const patterns = [
    /\\?"player_type\\?":\\?"([^\\"]+)\\?"/i,
    /player_type":"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export function normalizeNicoNicoUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl.trim());
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function isNicoNicoSeigaUrl(rawUrl: string) {
  const normalizedUrl = normalizeNicoNicoUrl(rawUrl);

  if (!normalizedUrl) {
    return false;
  }

  try {
    const url = new URL(normalizedUrl);
    const isExpectedHost =
      url.hostname === 'seiga.nicovideo.jp' ||
      url.hostname === 'sp.seiga.nicovideo.jp' ||
      url.hostname === 'sp.manga.nicovideo.jp';

    const isLegacyPath = url.pathname.startsWith('/watch/') || url.pathname.startsWith('/comic/');
    const isMobileMangaPath =
      url.pathname.startsWith('/title/') ||
      url.pathname.startsWith('/episode/') ||
      url.pathname.startsWith('/watch/') ||
      url.pathname.startsWith('/comic/');

    if (url.hostname === 'sp.manga.nicovideo.jp') {
      return isMobileMangaPath;
    }

    return isLegacyPath;
  } catch {
    return false;
  }
}

export function detectNicoNicoSignals(html: string) {
  const signals: string[] = [];

  if (/og:title/i.test(html)) {
    signals.push('og:title detectado no HTML');
  }

  if (/og:description/i.test(html)) {
    signals.push('og:description detectado no HTML');
  }

  if (/canvas/i.test(html)) {
    signals.push('Referências a canvas detectadas');
  }

  if (/image|img/i.test(html)) {
    signals.push('Referências a imagem detectadas');
  }

  if (/episode|chapter|comic|watch|title/i.test(html)) {
    signals.push('Referências a capítulo/viewer detectadas');
  }

  if (/manga\.nicovideo\.jp/i.test(html)) {
    signals.push('Referências ao domínio manga.nicovideo.jp detectadas');
  }

  if (/deliver\.cdn\.nicomanga\.jp\/material/i.test(html)) {
    signals.push('Referências a material do CDN detectadas');
  }

  return signals;
}

export async function startNicoNicoCapture(
  input: CaptureChapterInput,
): Promise<CaptureChapterResult> {
  const normalizedUrl = normalizeNicoNicoUrl(input.url);

  if (!isNicoNicoSeigaUrl(input.url)) {
    return {
      source: 'Nico Nico',
      requestedUrl: input.url,
      normalizedUrl,
      status: 'invalid_url',
      title: null,
      description: null,
      signals: [],
      scriptSnippetCount: 0,
      scriptSnippets: [],
      endpointCandidates: [],
      comicId: null,
      episodeId: null,
      materialCandidates: [],
      candidateMaterialCount: 0,
      frameCount: null,
      playerType: null,
      contentSnippet: null,
      pageFieldSignals: [],
      notes: [
        'URL inválida para a fonte alvo atual.',
        'Use uma URL do seiga.nicovideo.jp ou do sp.manga.nicovideo.jp.',
      ],
    };
  }

  const response = await fetch(normalizedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ManiacReader/0.1; +https://vercel.com)',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8,ja;q=0.7',
    },
    cache: 'no-store',
  });

  const html = await response.text();
  const title = extractMetaContent(html, 'og:title') ?? extractMetaContent(html, 'twitter:title');
  const description =
    extractMetaContent(html, 'og:description') ?? extractMetaContent(html, 'description');
  const signals = detectNicoNicoSignals(html);
  const { total: scriptSnippetCount, snippets: scriptSnippets } = extractScriptSnippets(html);
  const endpointCandidates = extractEndpointCandidates(html);
  const { comicId, episodeId } = extractIds(html);
  const materialCandidates = extractMaterialCandidates(html);
  const candidateMaterialCount = materialCandidates.length;
  const contentSnippet = extractContentSnippet(html, scriptSnippets);
  const pageFieldSignals = extractPageFieldSignals(contentSnippet);
  const frameCount = extractFrameCount(contentSnippet);
  const playerType = extractPlayerType(contentSnippet);

  return {
    source: 'Nico Nico',
    requestedUrl: input.url,
    normalizedUrl,
    status: 'inspected',
    title,
    description,
    signals,
    scriptSnippetCount,
    scriptSnippets,
    endpointCandidates,
    comicId,
    episodeId,
    materialCandidates,
    candidateMaterialCount,
    frameCount,
    playerType,
    contentSnippet,
    pageFieldSignals,
    notes: [
      'A URL foi validada contra a fonte alvo inicial.',
      'O backend já buscou o HTML da página do capítulo.',
      'Scripts relevantes e possíveis endpoints do viewer foram extraídos.',
      'Materiais do CDN foram separados como candidatos iniciais, mas não representam a contagem real de leitura.',
      'A leitura real agora deve usar frameCount/playerType do payload antes de tentar montar páginas.',
      'Próxima etapa: interceptar as requisições do viewer para descobrir de onde saem os frames/páginas completos.',
    ],
  };
}
