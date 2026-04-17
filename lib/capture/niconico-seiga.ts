export type CaptureChapterInput = {
  url: string;
};

export type CaptureChapterResult = {
  source: 'Nico Nico Seiga';
  requestedUrl: string;
  normalizedUrl: string;
  status: 'invalid_url' | 'inspected' | 'pending_parser';
  title: string | null;
  description: string | null;
  signals: string[];
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
      url.hostname === 'seiga.nicovideo.jp' || url.hostname === 'sp.seiga.nicovideo.jp';
    const isExpectedPath = url.pathname.startsWith('/watch/') || url.pathname.startsWith('/comic/');

    return isExpectedHost && isExpectedPath;
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

  if (/episode|chapter|comic|watch/i.test(html)) {
    signals.push('Referências a capítulo/viewer detectadas');
  }

  return signals;
}

export async function startNicoNicoCapture(
  input: CaptureChapterInput,
): Promise<CaptureChapterResult> {
  const normalizedUrl = normalizeNicoNicoUrl(input.url);

  if (!isNicoNicoSeigaUrl(input.url)) {
    return {
      source: 'Nico Nico Seiga',
      requestedUrl: input.url,
      normalizedUrl,
      status: 'invalid_url',
      title: null,
      description: null,
      signals: [],
      notes: [
        'URL inválida para a fonte alvo atual.',
        'Use uma URL do seiga.nicovideo.jp com caminho /watch/ ou /comic/.',
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

  return {
    source: 'Nico Nico Seiga',
    requestedUrl: input.url,
    normalizedUrl,
    status: 'inspected',
    title,
    description,
    signals,
    notes: [
      'A URL foi validada contra a fonte alvo inicial.',
      'O backend já buscou o HTML da página do capítulo.',
      'Próxima etapa: localizar o viewer e o payload real das páginas.',
    ],
  };
}
