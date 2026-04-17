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
  estimatedPageCount: number;
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
    .filter((script) => /episode|viewer|canvas|image|img|comic|manga|watch|api|json|material/i.test(script))
    .slice(0, maxCount)
    .map((script) => script.replace(/\s+/g, ' ').slice(0, 800));

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
  const comicMatch = decoded.match(/https:\/\/manga\.nicovideo\.jp\/comic\/(\d+)/i) ?? decoded.match(/"id":(\d+)/i);
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
      estimatedPageCount: 0,
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
  const estimatedPageCount = materialCandidates.length;

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
    estimatedPageCount,
    notes: [
      'A URL foi validada contra a fonte alvo inicial.',
      'O backend já buscou o HTML da página do capítulo.',
      'Scripts relevantes e possíveis endpoints do viewer foram extraídos.',
      'Materiais do CDN foram separados como candidatos de páginas do episódio.',
      'Próxima etapa: validar se esses materiais representam o episódio inteiro e em qual ordem.',
    ],
  };
}
