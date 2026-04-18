# ManiacReader

Base de investigação e reader para o recomeço do MangaX 2.0.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Vercel / Codespaces
- Playwright (para probes reais de viewer)

## Objetivo desta fase

1. Validar a fonte alvo no backend.
2. Descobrir como o viewer entrega as páginas reais.
3. Transformar a captura em manifesto utilizável pelo reader.
4. Só depois avançar para proxy, OCR e tradução.

## Fonte alvo atual prioritária

- Comic Walker

## Fonte legado ainda presente no código

- Nico Nico Manga / Nico Nico Seiga

Essa parte não é mais a frente principal da investigação. Ela continua no repositório apenas como legado técnico e referência de tentativas anteriores.

## Rotas principais

- `/` — home
- `/import` — inspeção experimental do capítulo
- `/reader` — reader guiado por manifesto
- `/status` — status consolidado do projeto
- `/viewer-network-phase` — documentação de fase legada do Nico
- `/probe` — stub visual de probe

## APIs principais

- `POST /api/capture-chapter`
- `GET /api/chapter-status`
- `GET /api/project-status`
- `GET /api/reader-image`

## Estado atual da investigação

Para a URL de teste do Comic Walker

- `https://comic-walker.com/detail/KC_008566_S/episodes/KC_0085660000200011_E`

já foi confirmado:

- o reader consegue carregar o manifesto do episódio
- o proxy de imagem aceita hosts do Comic Walker
- o probe do Comic Walker gera `public/manifests/KC_0085660000200011_E.json`
- o episódio aparece no reader com `source = Comic Walker`

## Problema atual

O gargalo atual não é mais manifesto nem host bloqueado.

O manifesto do Comic Walker ainda mistura:

- páginas reais do capítulo
- assets de interface do site
- imagens promocionais / logos / badges / sprites

Exemplos já observados na captura:

- `sprite...svg`
- `dots...svg`
- `AppPromotion...png`
- `AppStoreBadge...svg`
- `ABJMark...svg`

Ao mesmo tempo, o manifesto também já encontra arquivos com cara de página real, como:

- `008566_001_01_0001.jpg`
- `008592_001_01_0001.jpg`
- `004657_001_01_0001.jpg`

## Conclusão desta etapa

A arquitetura base do ManiacReader já funciona para Comic Walker:

- probe → manifesto → reader

O bloqueio atual é de seleção correta das páginas do capítulo, não de engenharia reversa pesada como no Nico.

## Próxima etapa técnica real

A próxima fase precisa descobrir uma forma confiável de capturar somente as páginas reais do Comic Walker.

Possíveis caminhos:

- apertar o filtro do probe
- localizar um endpoint/JSON do viewer com a lista real de páginas
- excluir assets de interface por path, nome, tipo MIME ou contexto de request

## O que já ficou preparado no repositório

- `tools/comicwalker-probe.mjs`
- `app/api/reader-image/route.ts`
- `public/manifests/<episodeId>.json`
- `components/reader/*`
- `lib/reader/*`

## Fluxo atual do reader

O reader consome um manifesto local:

- `public/manifests/<episodeId>.json`

Exemplo atual prioritário:

- `/reader?episodeId=KC_0085660000200011_E`

## Como rodar o probe atual do Comic Walker

Instale dependências:

```bash
npm install
```

Instale o Chromium do Playwright:

```bash
npm run probe:viewer:install
```

Execute o probe do Comic Walker:

```bash
npm run probe:comicwalker
```

Também é possível passar outra URL-alvo:

```bash
node tools/comicwalker-probe.mjs https://comic-walker.com/detail/KC_008566_S/episodes/KC_0085660000200011_E
```

## Saídas esperadas do probe

Ao rodar:

```bash
npm run probe:comicwalker
```

as saídas esperadas são:

- `debug/<episodeId>/comicwalker-probe-report.json`
- `public/manifests/<episodeId>.json`

## Critério de avanço de fase

O projeto só deve avançar para OCR e tradução depois que o reader estiver conseguindo:

- abrir o manifesto real do Comic Walker
- renderizar apenas páginas reais do capítulo
- operar sem assets de interface misturados como páginas
