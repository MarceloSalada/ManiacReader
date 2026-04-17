import type { ChapterManifest, ReaderUnit, ReaderUnitKind } from '@/lib/reader/types';

function normalizeUnit(rawUnit: unknown, fallbackIndex: number): ReaderUnit | null {
  if (!rawUnit || typeof rawUnit !== 'object') {
    return null;
  }

  const candidate = rawUnit as Record<string, unknown>;
  const url = typeof candidate.url === 'string' ? candidate.url : null;

  if (!url) {
    return null;
  }

  const kindValue = candidate.kind;
  const kind: ReaderUnitKind =
    kindValue === 'drm-image' || kindValue === 'image' || kindValue === 'unknown'
      ? kindValue
      : 'unknown';

  return {
    index: typeof candidate.index === 'number' ? candidate.index : fallbackIndex,
    url,
    filename: typeof candidate.filename === 'string' ? candidate.filename : null,
    kind,
  };
}

function normalizeManifest(rawManifest: unknown): ChapterManifest | null {
  if (!rawManifest || typeof rawManifest !== 'object') {
    return null;
  }

  const candidate = rawManifest as Record<string, unknown>;
  const source = candidate.source;
  const targetUrl = candidate.targetUrl;
  const unitsRaw = Array.isArray(candidate.units) ? candidate.units : [];

  if (source !== 'Nico Nico' || typeof targetUrl !== 'string') {
    return null;
  }

  const units = unitsRaw
    .map((unit, index) => normalizeUnit(unit, index + 1))
    .filter((unit): unit is ReaderUnit => unit !== null)
    .sort((left, right) => left.index - right.index);

  return {
    source,
    targetUrl,
    comicId: typeof candidate.comicId === 'string' ? candidate.comicId : null,
    episodeId: typeof candidate.episodeId === 'string' ? candidate.episodeId : null,
    playerType: typeof candidate.playerType === 'string' ? candidate.playerType : null,
    frameCount: typeof candidate.frameCount === 'number' ? candidate.frameCount : null,
    capturedCount:
      typeof candidate.capturedCount === 'number' ? candidate.capturedCount : units.length,
    isComplete: typeof candidate.isComplete === 'boolean' ? candidate.isComplete : false,
    units,
  };
}

export async function loadManifest(episodeId: string): Promise<ChapterManifest | null> {
  const normalizedEpisodeId = episodeId.trim();

  if (!normalizedEpisodeId) {
    return null;
  }

  const response = await fetch(`/manifests/${encodeURIComponent(normalizedEpisodeId)}.json`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as unknown;
  return normalizeManifest(payload);
}
