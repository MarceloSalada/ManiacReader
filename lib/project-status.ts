export type ProjectStatusSummary = {
  projectName: string;
  currentStage: string;
  completedFindings: string[];
  closedQuestions: string[];
  openQuestions: string[];
  blockedBy: string[];
  nextPhaseName: string;
  nextPhaseEntryPoints: string[];
};

export function getProjectStatusSummary(): ProjectStatusSummary {
  return {
    projectName: 'ManiacReader',
    currentStage: 'HTML/payload investigation closed; viewer-network phase prepared',
    completedFindings: [
      'Nico Nico Manga source validated for the target episode URL.',
      'comicId and episodeId can be extracted from the initial payload.',
      'player_type is scroll.',
      'frameCount is 42 for the tested episode.',
      'Initial material URLs found in the HTML do not represent the full reading sequence.',
    ],
    closedQuestions: [
      'Is the target URL valid and readable from the backend?',
      'Does the HTML initial payload expose enough information to detect viewer mode?',
      'Are the first CDN materials equivalent to full chapter pages? No.',
    ],
    openQuestions: [
      'Which hydrated viewer request returns the actual reading units?',
      'Are the reading units full images, frames, or cropped scroll segments?',
      'What is the correct ingestion strategy for /reader once those units are known?',
    ],
    blockedBy: [
      'Real browser automation and network interception are not implemented in the current stack.',
      'The current Next.js + Vercel Hobby phase is not enough to derive the complete reading list from HTML alone.',
    ],
    nextPhaseName: 'viewer-network-interception',
    nextPhaseEntryPoints: ['/viewer-network-phase', '/api/viewer-network-phase', '/api/viewer-network-runbook'],
  };
}
