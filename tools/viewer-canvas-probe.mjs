#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_TARGET_URL = 'https://sp.manga.nicovideo.jp/watch/mg197350';
const DEFAULT_TIMEOUT_MS = 25000;

function extractEpisodeId(targetUrl) {
  const match = targetUrl.match(/\/watch\/(mg\d+)/i) ?? targetUrl.match(/\/episode\/([^/?#]+)/i);
  return match?.[1] ?? 'unknown-episode';
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function main(targetUrl) {
  const episodeId = extractEpisodeId(targetUrl);
  const debugDir = path.resolve(process.cwd(), 'debug', episodeId);
  ensureDirectory(debugDir);

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-software-rasterizer',
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
  const runtimeEvents = [];

  await page.exposeFunction('reportCanvasProbeEvent', (event) => {
    runtimeEvents.push({
      ...event,
      observedAt: new Date().toISOString(),
    });
  });

  await page.addInitScript(() => {
    const safeReport = (event) => {
      try {
        window.reportCanvasProbeEvent?.(event);
      } catch {}
    };

    const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      try {
        const source = args[0];
        const src = source?.src || source?.currentSrc || source?.tagName || 'unknown_source';
        const event = {
          type: 'drawImage',
          source: typeof src === 'string' ? src : String(src),
          argc: args.length,
        };

        if (args.length === 9) {
          event.sx = args[1];
          event.sy = args[2];
          event.sw = args[3];
          event.sh = args[4];
          event.dx = args[5];
          event.dy = args[6];
          event.dw = args[7];
          event.dh = args[8];
        } else if (args.length === 5) {
          event.dx = args[1];
          event.dy = args[2];
          event.dw = args[3];
          event.dh = args[4];
        } else if (args.length === 3) {
          event.dx = args[1];
          event.dy = args[2];
        }

        safeReport(event);
      } catch {}

      return originalDrawImage.apply(this, args);
    };

    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function (object) {
      const blobUrl = originalCreateObjectURL.call(this, object);
      safeReport({
        type: 'blob-created',
        blobUrl,
        mimeType: object?.type || '',
        size: typeof object?.size === 'number' ? object.size : null,
      });
      return blobUrl;
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
  });

  console.log(`[CanvasProbe] Abrindo ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => null);
  await page.waitForTimeout(2500);

  const tap = async (x, y) => {
    await page.mouse.click(x, y).catch(() => null);
    await page.waitForTimeout(600);
  };

  const scrollBy = async (value, waitMs = 1200) => {
    await page.evaluate((v) => window.scrollBy(0, v), value).catch(() => null);
    await page.waitForTimeout(waitMs);
  };

  await tap(195, 420);
  await scrollBy(500, 1500);
  await scrollBy(700, 1600);
  await tap(195, 420);
  await scrollBy(900, 1800);
  await page.waitForTimeout(DEFAULT_TIMEOUT_MS);

  const drawEvents = runtimeEvents.filter((e) => e.type === 'drawImage');
  const blobEvents = runtimeEvents.filter((e) => e.type === 'blob-created' || e.type === 'canvas-toBlob' || e.type === 'canvas-toDataURL');

  const output = {
    targetUrl,
    episodeId,
    timestamp: new Date().toISOString(),
    drawEventCount: drawEvents.length,
    blobEventCount: blobEvents.length,
    runtimeEvents,
  };

  const outPath = path.join(debugDir, 'canvas-probe.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(`[CanvasProbe] drawImage events: ${drawEvents.length}`);
  console.log(`[CanvasProbe] blob/canvas events: ${blobEvents.length}`);
  if (drawEvents.length > 0) {
    console.log('[CanvasProbe] Primeiros drawImage events:');
    drawEvents.slice(0, 20).forEach((e, idx) => {
      console.log(`[${idx}] src=${String(e.source).slice(0, 120)}`);
      console.log(`    argc=${e.argc} sx=${e.sx ?? '-'} sy=${e.sy ?? '-'} sw=${e.sw ?? '-'} sh=${e.sh ?? '-'} dx=${e.dx ?? '-'} dy=${e.dy ?? '-'} dw=${e.dw ?? '-'} dh=${e.dh ?? '-'}`);
    });
  }
  console.log(`[CanvasProbe] Saída salva em ${outPath}`);

  await browser.close();
}

const targetUrl = process.argv[2] || DEFAULT_TARGET_URL;
main(targetUrl).catch((error) => {
  console.error('[CanvasProbe] Erro fatal:', error);
  process.exitCode = 1;
});
