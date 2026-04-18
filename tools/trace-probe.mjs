#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const targetUrl = process.argv[2] || 'https://sp.manga.nicovideo.jp/watch/mg197350';
const episodeMatch = targetUrl.match(/\/watch\/(mg\d+)/i) ?? targetUrl.match(/\/episode\/([^/?#]+)/i);
const episodeId = episodeMatch?.[1] ?? 'unknown-episode';
const debugDir = path.resolve(process.cwd(), 'debug', episodeId);
const LOG_FILE = path.join(debugDir, 'trace-events.ndjson');

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

ensureDirectory(debugDir);
fs.writeFileSync(LOG_FILE, '', 'utf8');

(async () => {
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
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  await page.exposeFunction('appendTrace', (data) => {
    fs.appendFileSync(LOG_FILE, JSON.stringify(data) + '\n');
  });

  await page.addInitScript(() => {
    const emit = (label, details = {}) => {
      try {
        window.appendTrace({
          label,
          ts: Date.now(),
          stack: new Error().stack?.split('\n').slice(2, 7).join(' | ') || '',
          ...details,
        });
      } catch {}
    };

    const wrapResponse = (method) => {
      const orig = Response.prototype[method];
      Response.prototype[method] = function () {
        emit(`Response.${method}`, { url: this.url });
        return orig.apply(this, arguments);
      };
    };
    ['arrayBuffer', 'blob'].forEach(wrapResponse);

    if (typeof Worker !== 'undefined') {
      const origPost = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function (msg, transfer) {
        let keys = typeof msg;
        let hasBuffer = false;
        let hasUint8Array = false;
        let isWasm = false;

        try {
          if (msg && typeof msg === 'object') {
            keys = Object.keys(msg).slice(0, 20);
            hasBuffer = msg instanceof ArrayBuffer || msg.buffer instanceof ArrayBuffer;
            hasUint8Array = msg instanceof Uint8Array;
            isWasm = keys.some((k) => /wasm/i.test(String(k))) ||
              (typeof msg.url === 'string' && /\.wasm($|\?)/i.test(msg.url));
          }
        } catch {}

        emit('Worker.postMessage', {
          hasBuffer,
          hasUint8Array,
          keys,
          hasTransfer: Array.isArray(transfer) ? transfer.length > 0 : Boolean(transfer),
          isWasm,
        });
        return origPost.apply(this, [msg, transfer]);
      };
    }

    if (typeof window.createImageBitmap === 'function') {
      const origBitmap = window.createImageBitmap;
      window.createImageBitmap = function (src) {
        emit('createImageBitmap', {
          type: src?.constructor?.name || typeof src,
          size: typeof src?.size === 'number' ? src.size : null,
          mime: src?.type || '',
        });
        return origBitmap.apply(this, arguments);
      };
    }

    const origCreateURL = URL.createObjectURL;
    URL.createObjectURL = function (obj) {
      const url = origCreateURL(obj);
      if (obj instanceof Blob) {
        emit('URL.createObjectURL', { url, size: obj.size, mime: obj.type });
      }
      return url;
    };
  });

  console.log(`[*] Iniciando rastreio em: ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 300)).catch(() => null);
  console.log('[*] Scroll realizado. Aguardando 10s para captura de eventos...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log(`[v] Trace concluído. Verifique: ${LOG_FILE}`);
})();
