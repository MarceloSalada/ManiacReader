export type ReaderUnitKind = 'drm-image' | 'image' | 'unknown';

export type ReaderUnit = {
  index: number;
  url: string;
  filename: string | null;
  kind: ReaderUnitKind;
};

export type ReaderSource = 'Nico Nico' | 'Comic Walker';

export type ChapterManifest = {
  source: ReaderSource;
  targetUrl: string;
  comicId: string | null;
  episodeId: string | null;
  playerType: string | null;
  frameCount: number | null;
  capturedCount: number;
  isComplete: boolean;
  units: ReaderUnit[];
};
