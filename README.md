# ManiacReader

Base limpa para o recomeço do MangaX 2.0.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Vercel

## Objetivo desta fase

1. Validar a fonte alvo no backend.
2. Identificar como o viewer entrega a leitura real.
3. Só depois montar o reader final.

## Fonte alvo inicial

- Nico Nico Manga / Nico Nico Seiga

## Rotas principais

- `/` — home
- `/import` — inspeção experimental do capítulo
- `/reader` — shell do leitor
- `/viewer-network-phase` — descrição da próxima fase
- `/status` — status consolidado do projeto

## APIs

- `POST /api/capture-chapter`
- `GET /api/chapter-status`
- `POST /api/translate-region`
- `GET /api/viewer-network-phase`
- `GET /api/viewer-network-runbook`
- `GET /api/project-status`

## Estado atual da investigação

Para a URL de teste `https://sp.manga.nicovideo.jp/watch/mg197350`, o backend já conseguiu confirmar:

- `comicId = 23827`
- `episodeId = mg197350`
- `player_type = scroll`
- `frameCount = 42`
- alguns materiais do CDN aparecem no HTML inicial, mas **não representam a contagem real de leitura**

## Conclusão desta etapa

O Nico Nico não entrega esse episódio como uma lista simples de páginas no HTML inicial.

O viewer trabalha com:

- payload do Next.js com metadados
- leitura em modo `scroll`
- contagem de `frame`
- assets carregados depois da hidratação do viewer

## Próxima etapa técnica real

A próxima fase precisa interceptar as requisições do viewer para descobrir de onde saem:

- frames completos
- imagens reais de leitura
- ou metadados de corte/scroll

Sem essa interceptação, continuar só no parse do HTML inicial levaria a resultados parciais e contagens falsas.

## O que já ficou preparado no repositório

Foi adicionada uma fase explícita de planejamento para essa próxima etapa:

- `lib/capture/viewer-network-phase.ts`
- `lib/capture/viewer-network-runbook.ts`
- `tools/viewer-network-probe.example.ts`
- `GET /api/viewer-network-phase`
- `GET /api/viewer-network-runbook`

Esses arquivos não fingem executar a interceptação. Eles deixam clara a próxima fase e fornecem uma base objetiva para a implementação real fora do fluxo simples da Vercel Hobby.
