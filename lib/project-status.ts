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
    currentStage: 'Comic Walker manifesto loads in reader; page selection still contaminated by site assets',
    completedFindings: [
      'Comic Walker episode URL is valid and reachable.',
      'The reader already loads the Comic Walker manifesto and opens the target episode.',
      'The image proxy already accepts Comic Walker hosts.',
      'The Comic Walker probe already generates a local manifest for KC_0085660000200011_E.',
      'The current issue is no longer manifest loading or host permission.',
    ],
    closedQuestions: [
      'Can the project leave the Nico-only flow and open Comic Walker in /reader? Yes.',
      'Does the current stack already support Comic Walker image proxying? Yes.',
      'Is the current blocker still related to DRM/descramble like Nico? Not at this stage.',
    ],
    openQuestions: [
      'Which Comic Walker requests correspond only to real chapter pages?',
      'How should the probe exclude sprites, badges, promotion assets and app UI images?',
      'Is there a cleaner JSON/viewer endpoint exposing the real ordered page list?',
    ],
    blockedBy: [
      'The Comic Walker probe still captures UI assets together with real chapter pages.',
      'The reader renders everything in units[] without a second validation layer.',
    ],
    nextPhaseName: 'comicwalker-page-isolation',
    nextPhaseEntryPoints: ['/reader', '/status', '/import'],
  };
}
