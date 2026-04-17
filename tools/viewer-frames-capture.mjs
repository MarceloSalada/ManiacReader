#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_TARGET_URL = 'https://sp.manga.nicovideo.jp/watch/mg197350';
const FRAMES_CAPTURE_TIMEOUT_MS = 12000;

function extractEpisodeId(targetUrl) {
  const match = targetUrl.match(/\/watch\/(mg\d+)/i) ?? targetUrl.match(/\/episode\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isFramesEndpoint(url, episodeId) {
  if (!/\/api\/v1\/app\/manga\/episodes\/\d+\/frames\?enable_webp=true/i.test(url)) {
    return false;
  }

  if (!episodeId) {
    return true;
  }

  const numericEpisodeId = episodeId.replace(/^mg/i, '');
  return url.includes(`/episodes/${numericEpisodeId}/frames`);
}

function extractFrameArray(payload) {
  const directCandidates = [
    payload?.data?.frames,
    payload?.frames,
    payload?.data?.result?.frames,
    payload?.result?.frames,
    payload?.data?.result,
  ];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }

  return [];
}

function extractFrameUrl(frame) {
  if (!frame) {
    return null;
  }

  if (typeof frame === 'string') {
    return /^https?:\/\//i.test(frame) ? frame : null;
  }

  const candidates = [
    frame.url,
    frame.image_url,
    frame.src,
    frame.source_url,
    frame.path,
    frame.meta?.source_url,
    frame.meta?.url,
    frame.image?.url,
    frame.asset?.url,
    frame.resource?.url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate)) {
      return candidate;
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

function buildManifestFromFramesPayload({ payload, targetUrl, episodeId }) {
  const frames = extractFrameArray(payload);
  if (!frames.length) {
    return null;
  }

  const units = frames
    .map((frame, index) => {
      const url = extractFrameUrl(frame);
      if (!url) {
        return null;
      }

      return {
        index: index + 1,
        url,
        filename: extractFilenameFromUrl(url) ?? `${episodeId}_${index + 1}.webp`,
        kind: /drm\.cdn\.nicomanga\.jp|deliver\.cdn\.nicomanga\.jp/i.test(url) ? 'drm-image' : 'unknown',
      };
    })
    .filter((unit) => unit !== null);

  if (!units.length) {
    return null;
  }

  return {
    source: 'Nico Nico',
    targetUrl,
    comicId: null,
    episodeId,
    playerType: null,
    frameCount: frames.length,
    capturedCount: units.length,
    isComplete: units.length === frames.length,
    units,
  };
}

async function runCapture(targetUrl) {
  const episodeId = extractEpisodeId(targetUrl) ?? 'unknown-episode';
  const debugDir = path.resolve(process.cwd(), 'debug', episodeId);
  const manifestDir = path.resolve(process.cwd(), 'public', 'manifests');
  ensureDirectory(debugDir);
  ensureDirectory(manifestDir);

  let framesCaptured = false;
  let resolveFrames;
  const framesPromise = new Promise((resolve) => {
    resolveFrames = resolve;
  });

  const { chromium } = await import('playwright');
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

  const page = await context.newPage();

  page.on('response', async (response) => {
    const url = response.url();
    if (!isFramesEndpoint(url, episodeId) || framesCaptured) {
      return;
    }

    framesCaptured = true;
    const contentType = response.headers()['content-type'] || '';
    const status = response.status();
    const textPath = path.join(debugDir, 'raw-frames.txt');
    const jsonPath = path.join(debugDir, 'raw-frames.json');

    try {
      const responseText = await response.text();
      fs.writeFileSync(textPath, responseText, 'utf-8');

      const parsed = safeJsonParse(responseText);
      if (parsed) {
        fs.writeFileSync(jsonPath, JSON.stringify(parsed, null, 2), 'utf-8');
        const manifest = buildManifestFromFramesPayload({ payload: parsed, targetUrl, episodeId });
        if (manifest) {
          const manifestPath = path.join(manifestDir, `${episodeId}.json`);
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
        }
        console.log(`[Frames] JSON salvo: ${jsonPath}`);
        console.log(`[Frames] Chaves raiz: ${Object.keys(parsed).join(', ')}`);
        if (parsed.data && typeof parsed.data === 'object') {
          console.log(`[Frames] Chaves em data: ${Object.keys(parsed.data).join(', ')}`);
        }
        console.log(`[Frames] Array detectado: ${extractFrameArray(parsed).length}`);
      } else {
        console.log(`[Frames] Resposta não parseou como JSON. TXT salvo em: ${textPath}`);
      }

      console.log(`[Frames] Endpoint capturado: ${url}`);
      console.log(`[Frames] status=${status} contentType=${contentType}`);
    } catch (error) {
      console.error(`[Frames] Falha ao salvar response do endpoint de frames: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      resolveFrames(true);
    }
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => null);
    await page.waitForTimeout(1800);
    await page.evaluate(() => window.scrollTo(0, 500)).catch(() => null);
    console.log('[Frames] Scroll mínimo realizado para disparar a API.');

    const captured = await Promise.race([
      framesPromise,
      new Promise((resolve) => setTimeout(() => resolve(false), FRAMES_CAPTURE_TIMEOUT_MS)),
    ]);

    if (!captured) {
      console.log('[Frames] Timeout sem capturar o endpoint de frames.');
    }
  } finally {
    if (browser.isConnected()) {
      await browser.close().catch(() => null);
    }
  }
}

const targetUrl = process.argv[2] || DEFAULT_TARGET_URL;
runCapture(targetUrl).catch((error) => {
  console.error('[Frames] Erro fatal:', error);
  process.exitCode = 1;
});
