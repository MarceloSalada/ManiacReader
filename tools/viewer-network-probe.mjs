#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_TARGET_URL = 'https://sp.manga.nicovideo.jp/watch/mg197350';
const DOMAINS_OF_INTEREST = [
  'sp.manga.nicovideo.jp',
  'manga.nicovideo.jp',
  'deliver.cdn.nicomanga.jp',
  'res.ads.nicovideo.jp',
];

function isInterestingUrl(url) {
  return DOMAINS_OF_INTEREST.some((domain) => url.includes(domain));
}

function classifyResponse(url, contentType) {
  if (contentType.includes('application/json')) return 'json';
  if (contentType.startsWith('image/')) return 'image';
  if (/material\//i.test(url)) return 'material';
  if (/thumb\//i.test(url)) return 'thumb';
  if (/watch\//i.test(url)) return 'watch';
  if (/api|viewer|episode|frame|page/i.test(url)) return 'api-or-viewer';
  return 'other';
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

async function runProbe(targetUrl) {
  console.log(`[Probe] Iniciando captura: ${targetUrl}`);

  const { chromium } = await loadPlaywright();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
  });

  const page = await context.newPage();
  const requests = [];
  const responses = [];

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

    if (!isInterestingUrl(url)) {
      return;
    }

    const headers = response.headers();
    const contentType = headers['content-type'] || '';
    const status = response.status();
    const kind = classifyResponse(url, contentType);

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
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => null);

    console.log('[Probe] Simulando scroll para hidratar o viewer...');
    for (let index = 0; index < 8; index += 1) {
      await page.mouse.wheel(0, 2200);
      await page.waitForTimeout(1200);
    }

    await page.waitForTimeout(2000);

    const report = {
      targetUrl,
      timestamp: new Date().toISOString(),
      domainsOfInterest: DOMAINS_OF_INTEREST,
      requestCount: requests.length,
      responseCount: responses.length,
      requests,
      responses,
    };

    const outputPath = path.resolve(process.cwd(), 'probe-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`[Probe] Relatório gerado: ${outputPath}`);
  } catch (error) {
    console.error('[Probe] Erro durante a captura:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

const targetUrl = process.argv[2] || DEFAULT_TARGET_URL;
runProbe(targetUrl);
