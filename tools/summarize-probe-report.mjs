#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const INPUT_PATH = process.argv[2] || 'probe-report.json';
const OUTPUT_JSON = process.argv[3] || 'probe-focus.json';
const OUTPUT_TXT = process.argv[4] || 'probe-focus.txt';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function truncate(value, max = 260) {
  if (typeof value !== 'string') return value;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function scoreResponse(item) {
  let score = 0;
  const url = String(item.url || '');
  const contentType = String(item.contentType || '');
  const excerpt = String(item.payloadExcerpt || '');
  const kind = String(item.kind || '');

  if (kind === 'json') score += 5;
  if (contentType.includes('application/json')) score += 5;
  if (kind === 'api-or-viewer') score += 3;
  if (/api|viewer|episode|frame|page|content|scroll|crop|image|images|result|resources/i.test(url)) score += 3;
  if (/frame|page|pages|image|images|content|contents|scroll|crop|result|resources/i.test(excerpt)) score += 4;
  if (/analytics|percent_scrolled/i.test(url) || kind === 'analytics') score -= 8;
  if (contentType.includes('application/javascript')) score -= 6;
  if (/<!DOCTYPE html>|<html/i.test(excerpt)) score -= 6;
  if (/link_url|alt_text/i.test(excerpt)) score -= 3;

  return score;
}

function pickNoiseSummary(responses) {
  const counts = {};
  for (const item of responses) {
    const key = item.kind || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function normalizeItem(item) {
  return {
    url: item.url || null,
    hostname: item.hostname || null,
    kind: item.kind || null,
    status: item.status ?? null,
    contentType: item.contentType || null,
    jsonKeys: Array.isArray(item.jsonKeys) ? item.jsonKeys : [],
    reasons: Array.isArray(item.reasons) ? item.reasons : [],
    payloadExcerpt: truncate(item.payloadExcerpt, 320),
    score: scoreResponse(item),
  };
}

function buildFocus(report) {
  const responses = Array.isArray(report.responses) ? report.responses : [];
  const manifestSummary = report.manifestSummary || {};

  const jsonResponses = responses
    .filter((item) => String(item.contentType || '').includes('application/json'))
    .map(normalizeItem)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const likelyIndexCandidates = responses
    .map(normalizeItem)
    .filter((item) => item.score >= 6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const strongCandidates = likelyIndexCandidates.filter(
    (item) => item.kind === 'json' || String(item.contentType || '').includes('application/json'),
  );

  return {
    targetUrl: report.targetUrl || null,
    manifestSummary: {
      episodeId: manifestSummary.episodeId || null,
      comicId: manifestSummary.comicId || null,
      playerType: manifestSummary.playerType || null,
      frameCount: manifestSummary.frameCount ?? null,
      capturedCount: manifestSummary.capturedCount ?? null,
      isComplete: manifestSummary.isComplete ?? null,
    },
    noiseSummary: pickNoiseSummary(responses),
    jsonResponses,
    likelyIndexCandidates,
    strongCandidates,
  };
}

function renderText(focus) {
  const lines = [];
  lines.push('MANIACREADER PROBE FOCUS');
  lines.push('');
  lines.push(`targetUrl: ${focus.targetUrl}`);
  lines.push(`episodeId: ${focus.manifestSummary.episodeId}`);
  lines.push(`comicId: ${focus.manifestSummary.comicId}`);
  lines.push(`playerType: ${focus.manifestSummary.playerType}`);
  lines.push(`frameCount: ${focus.manifestSummary.frameCount}`);
  lines.push(`capturedCount: ${focus.manifestSummary.capturedCount}`);
  lines.push(`isComplete: ${focus.manifestSummary.isComplete}`);
  lines.push('');
  lines.push(`noiseSummary: ${JSON.stringify(focus.noiseSummary)}`);
  lines.push('');
  lines.push('STRONG CANDIDATES');

  if (focus.strongCandidates.length === 0) {
    lines.push('- none');
  } else {
    for (const [index, item] of focus.strongCandidates.entries()) {
      lines.push(`- [${index}] score=${item.score} kind=${item.kind} status=${item.status}`);
      lines.push(`  host: ${item.hostname}`);
      lines.push(`  url: ${item.url}`);
      lines.push(`  contentType: ${item.contentType}`);
      lines.push(`  jsonKeys: ${JSON.stringify(item.jsonKeys)}`);
      lines.push(`  reasons: ${JSON.stringify(item.reasons)}`);
      lines.push(`  excerpt: ${item.payloadExcerpt}`);
    }
  }

  lines.push('');
  lines.push('TOP JSON RESPONSES');
  if (focus.jsonResponses.length === 0) {
    lines.push('- none');
  } else {
    for (const [index, item] of focus.jsonResponses.entries()) {
      lines.push(`- [${index}] score=${item.score} kind=${item.kind} status=${item.status}`);
      lines.push(`  host: ${item.hostname}`);
      lines.push(`  url: ${item.url}`);
      lines.push(`  jsonKeys: ${JSON.stringify(item.jsonKeys)}`);
      lines.push(`  excerpt: ${item.payloadExcerpt}`);
    }
  }

  return lines.join('\n');
}

const inputPath = path.resolve(process.cwd(), INPUT_PATH);
const outputJsonPath = path.resolve(process.cwd(), OUTPUT_JSON);
const outputTxtPath = path.resolve(process.cwd(), OUTPUT_TXT);

if (!fs.existsSync(inputPath)) {
  console.error(`[Summarize] Arquivo não encontrado: ${inputPath}`);
  process.exit(1);
}

const report = readJson(inputPath);
const focus = buildFocus(report);

fs.writeFileSync(outputJsonPath, JSON.stringify(focus, null, 2), 'utf-8');
fs.writeFileSync(outputTxtPath, renderText(focus), 'utf-8');

console.log(`[Summarize] JSON enxuto gerado: ${outputJsonPath}`);
console.log(`[Summarize] TXT enxuto gerado: ${outputTxtPath}`);
console.log(`[Summarize] Strong candidates: ${focus.strongCandidates.length}`);
console.log(`[Summarize] Top JSON responses: ${focus.jsonResponses.length}`);
