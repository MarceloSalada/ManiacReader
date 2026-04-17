#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_TARGET_URL = 'https://sp.manga.nicovideo.jp/watch/mg197350';
const DEFAULT_WAIT_MS = 25000;

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

  await page.exposeFunction('reportBlobProbeEvent', (event) => {
    runtimeEvents.push({
      ...event,
      observedAt: new Date().toISOString(),
    });
  });

  await page.addInitScript(() => {
    const safeReport = (event) => {
      try {
        window.reportBlobProbeEvent?.(event);
      } catch {}
    };

    const originalBlob = window.Blob;
    window.Blob = function BlobProxy(chunks = [], options = {}) {
      const blob = new originalBlob(chunks, options);
      safeReport({
        type: 'blob-constructed',
        size: blob.size,
        mimeType: options?.type || blob.type || '',
        chunkCount: Array.isArray(chunks) ? chunks.length : null,
      });
      return blob;
    };
    window.Blob.prototype = originalBlob.prototype;

    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function (object) {
      const blobUrl = originalCreateObjectURL.call(this, object);
      safeReport({
        type: 'blob-url-created',
        blobUrl,
        size: typeof object?.size === 'number' ? object.size : null,
        mimeType: object?.type || '',
      });
      return blobUrl;
    };

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const input = args[0];
      const requestUrl = typeof input === 'string' ? input : input?.url || String(input);
      const response = await originalFetch(...args);
      safeReport({
        type: 'fetch-complete',
        url: response.url || requestUrl,
        status: response.status,
        contentType: response.headers.get('content-type') || '',
      });
      return response;
    };

    const originalArrayBuffer = Response.prototype.arrayBuffer;
    Response.prototype.arrayBuffer = async function (...args) {
      const value = await originalArrayBuffer.apply(this, args);
      safeReport({
        type: 'response-arrayBuffer',
        url: this.url || '',
        byteLength: value?.byteLength || 0,
        contentType: this.headers?.get?.('content-type') || '',
      });
      return value;
    };

    const originalBlobMethod = Response.prototype.blob;
    Response.prototype.blob = async function (...args) {
      const value = await originalBlobMethod.apply(this, args);
      safeReport({
        type: 'response-blob',
        url: this.url || '',
        size: value?.size || 0,
        mimeType: value?.type || '',
        contentType: this.headers?.get?.('content-type') || '',
      });
      return value;
    };

    if (typeof window.createImageBitmap === 'function') {
      const originalCreateImageBitmap = window.createImageBitmap;
      window.createImageBitmap = async function (...args) {
        const result = await originalCreateImageBitmap.apply(this, args);
        const source = args[0];
        safeReport({
          type: 'createImageBitmap',
          sourceType: source?.constructor?.name || typeof source,
          width: result?.width || null,
          height: result?.height || null,
          sourceSize: typeof source?.size === 'number' ? source.size : null,
          sourceMimeType: source?.type || '',
        });
        return result;
      };
    }

    if (typeof OffscreenCanvas !== 'undefined' && OffscreenCanvas.prototype?.convertToBlob) {
      const originalConvertToBlob = OffscreenCanvas.prototype.convertToBlob;
      OffscreenCanvas.prototype.convertToBlob = async function (...args) {
        const result = await originalConvertToBlob.apply(this, args);
        safeReport({
          type: 'offscreen-convertToBlob',
          width: this.width,
          height: this.height,
          size: result?.size || null,
          mimeType: result?.type || '',
        });
        return result;
      };
    }

    if (typeof Worker !== 'undefined') {
      const originalPostMessage = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function (message, transfer) {
        safeReport({
          type: 'worker-postMessage',
          workerScript: this?.__probeScriptUrl || 'unknown',
          messageType: message?.constructor?.name || typeof message,
          hasTransfer: Array.isArray(transfer) ? transfer.length > 0 : Boolean(transfer),
        });
        return originalPostMessage.call(this, message, transfer);
      };

      const OriginalWorker = Worker;
      // eslint-disable-next-line no-global-assign
      Worker = function WorkerProxy(scriptURL, options) {
        const worker = new OriginalWorker(scriptURL, options);
        worker.__probeScriptUrl = String(scriptURL);
        safeReport({
          type: 'worker-created',
          scriptURL: String(scriptURL),
        });
        return worker;
      };
      Worker.prototype = OriginalWorker.prototype;
    }
  });

  console.log(`[BlobProbe] Abrindo ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => null);
  await page.waitForTimeout(2500);

  const tap = async (x, y) => {
    await page.mouse.click(x, y).catch(() => null);
    await page.waitForTimeout(700);
  };

  const scrollBy = async (value, waitMs = 1400) => {
    await page.evaluate((v) => window.scrollBy(0, v), value).catch(() => null);
    await page.waitForTimeout(waitMs);
  };

  await tap(195, 420);
  await scrollBy(500, 1500);
  await scrollBy(700, 1600);
  await tap(195, 420);
  await scrollBy(900, 1800);
  await page.waitForTimeout(DEFAULT_WAIT_MS);

  const interesting = runtimeEvents.filter((e) =>
    [
      'blob-constructed',
      'blob-url-created',
      'fetch-complete',
      'response-arrayBuffer',
      'response-blob',
      'createImageBitmap',
      'offscreen-convertToBlob',
      'worker-created',
      'worker-postMessage',
    ].includes(e.type),
  );

  const output = {
    targetUrl,
    episodeId,
    timestamp: new Date().toISOString(),
    eventCount: runtimeEvents.length,
    interestingCount: interesting.length,
    runtimeEvents,
  };

  const outPath = path.join(debugDir, 'blob-probe.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(`[BlobProbe] interesting events: ${interesting.length}`);
  interesting.slice(0, 60).forEach((event, index) => {
    console.log(`[${index}] ${JSON.stringify(event)}`);
  });
  console.log(`[BlobProbe] Saída salva em ${outPath}`);

  await browser.close();
}

const targetUrl = process.argv[2] || DEFAULT_TARGET_URL;
main(targetUrl).catch((error) => {
  console.error('[BlobProbe] Erro fatal:', error);
  process.exitCode = 1;
});
