#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_TARGET_URL = 'https://sp.manga.nicovideo.jp/watch/mg197350';
const DOMAINS_OF_INTEREST = [
  'sp.manga.nicovideo.jp',
  'manga.nicovideo.jp',
  'deliver.cdn.nicomanga.jp',
  'drm.cdn.nicomanga.jp',
  'res.ads.nicovideo.jp',
];

function isInterestingUrl(url) {
  return DOMAINS_OF_INTEREST.some((domain) => url.includes(domain));
}

function classifyResponse(url, contentType) {
  if (/analytics\.google\.com|googletagmanager\.com/i.test(url)) return 'analytics';
  if (contentType.includes('application/json')) return 'json';
  if (url.startsWith('blob:')) return 'blob';
  if (/drm\.cdn\.nicomanga\.jp\/image/i.test(url)) return 'drm-image';
  if (contentType.startsWith('image/')) return 'image';
  if (/material\//i.test(url)) return 'material';
  if (/thumb\//i.test(url)) return 'thumb';
  if (/watch\//i.test(url)) return 'watch';
  if (/api|viewer|episode|frame|page/i.test(url)) return 'api-or-viewer';
  return 'other';
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractEpisodeId(targetUrl) {
  const match = targetUrl.match(/\/watch\/(mg\d+)/i) ?? targetUrl.match(/\/episode\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

function extractComicId(html) {
  const decoded = decodeHtmlEntities(html);
  const match =
    decoded.match(/https:\/\/manga\.nicovideo\.jp\/comic\/(\d+)/i) ?? decoded.match(/"id":(\d+)/i);
  return match?.[1] ?? null;
}

function extractContentSnippet(html) {
  const decoded = decodeHtmlEntities(html).replace(/\\\//g, '/');
  const directMarkers = ['"content":{', '\\"content\\":{'];

  for (const marker of directMarkers) {
    const index = decoded.indexOf(marker);
    if (index !== -1) {
      return decoded.slice(index, index + 4200).replace(/\s+/g, ' ');
    }
  }

  return null;
}

function extractFrameCount(snippet) {
  if (!snippet) {
    return null;
  }

  const patterns = [/counter\\?":\\?\{[^}]*\\?"frame\\?":(\d+)/i, /\\?"frame\\?":(\d+)/i];

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match?.[1]) {
      return Number(match[1]);
    }
  }

  return null;
}

function extractPlayerType(snippet) {
  if (!snippet) {
    return null;
  }

  const patterns = [/\\?"player_type\\?":\\?"([^\\"]+)\\?"/i, /player_type":"([^"]+)"/i];

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function extractFilenameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    return segments.at(-1) ?? null;
  } catch {
    return null;
  }
}

function extractNumericOrder(filename) {
  if (!filename) {
    return Number.POSITIVE_INFINITY;
  }

  const match = filename.match(/(\d+)/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function isAcceptedManifestAsset(response, filename) {
  if (response.kind !== 'drm-image') {
    return false;
  }

  if (!filename) {
    return false;
  }

  const normalizedFilename = filename.toLowerCase();

  if (!/\.(webp|jpg|jpeg|png)$/i.test(normalizedFilename)) {
    return false;
  }

  if (/loading\.(gif|webp|png|jpg|jpeg)$/i.test(normalizedFilename)) {
    return false;
  }

  if (/^(loading|spinner|thumb)\b/i.test(normalizedFilename)) {
    return false;
  }

  if (/viewer\//i.test(response.url) || /\/images\/viewer\//i.test(response.url)) {
    return false;
  }

  return true;
}

function buildManifest({ targetUrl, html, responses }) {
  const contentSnippet = extractContentSnippet(html);
  const frameCount = extractFrameCount(contentSnippet);
  const playerType = extractPlayerType(contentSnippet);
  const comicId = extractComicId(html);
  const episodeId = extractEpisodeId(targetUrl);

  const orderedCandidates = [];
  const seenUrls = new Set();

  responses.forEach((response, captureIndex) => {
    const filename = extractFilenameFromUrl(response.url);

    if (!isAcceptedManifestAsset(response, filename)) {
      return;
    }

    if (seenUrls.has(response.url)) {
      return;
    }

    seenUrls.add(response.url);

    orderedCandidates.push({
      captureIndex,
      numericOrder: extractNumericOrder(filename),
      url: response.url,
      filename,
      kind: 'drm-image',
    });
  });

  orderedCandidates.sort((left, right) => {
    if (left.numericOrder !== right.numericOrder) {
      return left.numericOrder - right.numericOrder;
    }

    return left.captureIndex - right.captureIndex;
  });

  const units = orderedCandidates.map((candidate, index) => ({
    index: index + 1,
    url: candidate.url,
    filename: candidate.filename,
    kind: candidate.kind,
  }));

  const capturedCount = units.length;
  const isComplete = typeof frameCount === 'number' ? capturedCount === frameCount : false;

  return {
    source: 'Nico Nico',
    targetUrl,
    comicId,
    episodeId,
    playerType,
    frameCount,
    capturedCount,
    isComplete,
    units,
  };
}

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    console.error('[Probe] O pacote "playwright" não está instalado neste ambiente.');
    console.error('[Probe] Instale em ambiente apropriado com: npm install -D playwright');
    process.exit(1);
  }
}

async function performProgressiveScroll(page) {
  console.log('[Probe] Iniciando rolagem progressiva longa...');

  for (let cycle = 0; cycle < 5; cycle += 1) {
    for (let step = 0; step < 8; step += 1) {
      await page.mouse.wheel(0, 1400);
      await page.waitForTimeout(900);
    }

    await page.evaluate(() => {
      window.scrollBy({ top: window.innerHeight * 1.2, behavior: 'instant' });
    });
    await page.waitForTimeout(1200);

    await page.keyboard.press('PageDown').catch(() => null);
    await page.waitForTimeout(800);
  }

  await page.evaluate(async () => {
    for (let index = 0; index < 12; index += 1) {
      window.scrollBy(0, Math.floor(window.innerHeight * 0.9));
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  });

  await page.waitForTimeout(5000);
}

async function gotoWithRetry(page, targetUrl) {
  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    return;
  } catch (error) {
    console.warn('[Probe] Primeira tentativa de navegação falhou. Recriando página e tentando de novo...');
    if (error instanceof Error) {
      console.warn(`[Probe] Motivo da primeira falha: ${error.message}`);
    }
    throw error;
  }
}

async function runProbe(targetUrl) {
  console.log(`[Probe] Iniciando captura: ${targetUrl}`);

  const { chromium } = await loadPlaywright();

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
    ],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });

  let page = await context.newPage();
  const requests = [];
  const responses = [];
  const runtimeEvents = [];

  await page.exposeFunction('reportProbeRuntimeEvent', (event) => {
    runtimeEvents.push({
      ...event,
      timestamp: new Date().toISOString(),
    });
  });

  await page.addInitScript(() => {
    const safeReport = (event) => {
      try {
        window.reportProbeRuntimeEvent?.(event);
      } catch {}
    };

    const normalizeUrl = (value) => {
      if (!value) return null;
      if (typeof value === 'string') return value;
      if (value instanceof Request) return value.url;
      if (typeof value.url === 'string') return value.url;
      return String(value);
    };

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const input = args[0];
      const init = args[1];
      const requestUrl = normalizeUrl(input);

      safeReport({
        type: 'fetch',
        stage: 'start',
        url: requestUrl,
        method: init?.method || (input instanceof Request ? input.method : 'GET'),
      });

      const response = await originalFetch(...args);

      safeReport({
        type: 'fetch',
        stage: 'end',
        url: response.url || requestUrl,
        status: response.status,
        contentType: response.headers.get('content-type') || '',
      });

      return response;
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this.__probeMethod = method;
      this.__probeUrl = typeof url === 'string' ? url : String(url);
      return originalOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function (...args) {
      const currentUrl = this.__probeUrl || null;
      const currentMethod = this.__probeMethod || 'GET';

      safeReport({
        type: 'xhr',
        stage: 'start',
        url: currentUrl,
        method: currentMethod,
      });

      this.addEventListener('loadend', () => {
        safeReport({
          type: 'xhr',
          stage: 'end',
          url: currentUrl,
          method: currentMethod,
          status: this.status,
          contentType: this.getResponseHeader('content-type') || '',
        });
      });

      return originalSend.call(this, ...args);
    };

    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function (object) {
      const blobUrl = originalCreateObjectURL.call(this, object);
      safeReport({
        type: 'blob',
        blobUrl,
        mimeType: object?.type || '',
        size: typeof object?.size === 'number' ? object.size : null,
      });
      return blobUrl;
    };

    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      safeReport({
        type: 'canvas-toDataURL',
        width: this.width,
        height: this.height,
        mimeType: args[0] || 'image/png',
      });
      return originalToDataURL.apply(this, args);
    };

    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      safeReport({
        type: 'canvas-toBlob',
        width: this.width,
        height: this.height,
        mimeType: type || 'image/png',
      });
      return originalToBlob.call(this, callback, type, quality);
    };
  });

  page.on('request', (request) => {
    const url = request.url();

    if (!isInterestingUrl(url)) {
      return;
    }

    requests.push({
      url,
      method: request.method(),
      resourceType: request.resourceType(),
      headers: request.headers(),
    });
  });

  page.on('response', async (response) => {
    const url = response.url();
    const headers = response.headers();
    const contentType = headers['content-type'] || '';
    const kind = classifyResponse(url, contentType);

    if (!isInterestingUrl(url) && kind !== 'analytics') {
      return;
    }

    const status = response.status();

    let payloadExcerpt = null;
    let jsonKeys = [];

    try {
      if (contentType.includes('application/json')) {
        const json = await response.json();
        jsonKeys = json && typeof json === 'object' ? Object.keys(json).slice(0, 20) : [];
        payloadExcerpt = JSON.stringify(json).slice(0, 2000);
      } else if (contentType.startsWith('text/') || contentType.includes('javascript')) {
        const text = await response.text();
        payloadExcerpt = text.slice(0, 2000);
      }
    } catch {
      payloadExcerpt = null;
    }

    responses.push({
      url,
      status,
      contentType,
      kind,
      jsonKeys,
      payloadExcerpt,
    });

    if (kind === 'json') {
      console.log(`[Probe] JSON detectado: ${url}`);
    }
    if (kind === 'blob') {
      console.log(`[Probe] Blob detectado: ${url}`);
    }
    if (kind === 'drm-image') {
      console.log(`[Probe] DRM image detectada: ${url}`);
    }
  });

  try {
    await gotoWithRetry(page, targetUrl);
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => null);

    await page.waitForTimeout(2500);
    await performProgressiveScroll(page);

    const finalHtml = await page.content();
    const manifest = buildManifest({ targetUrl, html: finalHtml, responses });

    const report = {
      targetUrl,
      timestamp: new Date().toISOString(),
      domainsOfInterest: DOMAINS_OF_INTEREST,
      requestCount: requests.length,
      responseCount: responses.length,
      runtimeEventCount: runtimeEvents.length,
      requests,
      responses,
      runtimeEvents,
      manifestSummary: {
        episodeId: manifest.episodeId,
        comicId: manifest.comicId,
        playerType: manifest.playerType,
        frameCount: manifest.frameCount,
        capturedCount: manifest.capturedCount,
        isComplete: manifest.isComplete,
      },
    };

    const reportPath = path.resolve(process.cwd(), 'probe-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    const episodeId = manifest.episodeId ?? 'unknown-episode';
    const manifestDir = path.resolve(process.cwd(), 'public', 'manifests');
    fs.mkdirSync(manifestDir, { recursive: true });
    const manifestPath = path.join(manifestDir, `${episodeId}.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    console.log(`[Probe] Relatório gerado: ${reportPath}`);
    console.log(`[Probe] Manifesto gerado: ${manifestPath}`);
    console.log(
      `[Probe] Captura consolidada: ${manifest.capturedCount} unidade(s) / ${manifest.frameCount ?? 'frameCount não detectado'}`,
    );
  } catch (error) {
    console.error('[Probe] Erro durante a captura:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

const targetUrl = process.argv[2] || DEFAULT_TARGET_URL;
runProbe(targetUrl);
