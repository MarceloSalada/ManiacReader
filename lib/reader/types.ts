export type ReaderUnitKind = 'drm-image' | 'image' | 'unknown';

export type ReaderUnit = {
  index: number;
  url: string;
  filename: string | null;
  kind: ReaderUnitKind;
};

export type ChapterManifest = {
  source: 'Nico Nico';
  targetUrl: string;
  comicId: string | null;
  episodeId: string | null;
  playerType: string | null;
  frameCount: number | null;
  capturedCount: number;
  isComplete: boolean;
  units: ReaderUnit[];
};
