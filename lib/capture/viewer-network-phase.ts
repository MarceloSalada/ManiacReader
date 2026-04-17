export type ViewerNetworkPhaseSummary = {
  phaseName: string;
  goal: string;
  currentStatus: 'planned';
  whyItIsNeeded: string[];
  blockersInCurrentStack: string[];
  requiredCapabilities: string[];
  expectedOutputs: string[];
};

export function getViewerNetworkPhaseSummary(): ViewerNetworkPhaseSummary {
  return {
    phaseName: 'viewer-network-interception',
    goal:
      'Abrir o viewer já hidratado do Nico Nico Manga e interceptar as requisições de rede para descobrir de onde saem os frames ou imagens reais da leitura.',
    currentStatus: 'planned',
    whyItIsNeeded: [
      'O HTML inicial só entrega metadados, player_type e frameCount.',
      'Os materiais do CDN visíveis no payload inicial não representam a leitura completa.',
      'A lista real de leitura parece surgir depois da hidratação do viewer.',
    ],
    blockersInCurrentStack: [
      'O projeto atual roda em Next.js + Vercel Hobby sem automação real de navegador embutida.',
      'Interceptação de rede do viewer exige browser automation com captura de requests/responses.',
      'Essa etapa não deve ser simulada com regex no HTML inicial, porque isso já foi levado ao limite útil.',
    ],
    requiredCapabilities: [
      'Abrir a página do episódio em navegador automatizado.',
      'Esperar hidratação completa do viewer.',
      'Capturar requests fetch/XHR/assets do domínio do viewer.',
      'Salvar URLs, payloads e respostas relevantes.',
      'Identificar qual resposta traz frames, imagens ou metadados de corte.',
    ],
    expectedOutputs: [
      'Lista real das requests-chave do viewer.',
      'Origem dos frames ou imagens de leitura.',
      'Estratégia correta para alimentar o /reader.',
    ],
  };
}
