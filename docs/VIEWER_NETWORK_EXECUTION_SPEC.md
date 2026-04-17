# Viewer Network Execution Spec

## Objetivo

Executar a próxima fase real do ManiacReader sem voltar ao parse do HTML inicial.

Meta: descobrir quais requisições do viewer hidratado do Nico Nico Manga entregam as unidades reais de leitura do episódio.

URL-alvo inicial:

- `https://sp.manga.nicovideo.jp/watch/mg197350`

## O que já foi provado

Para o episódio de teste, o projeto já confirmou:

- `comicId = 23827`
- `episodeId = mg197350`
- `player_type = scroll`
- `frameCount = 42`
- os materiais do HTML inicial **não** equivalem à lista completa de leitura

## O que NÃO fazer

Não voltar para:

- regex nova no HTML inicial
- novas tentativas de estimar páginas pelos primeiros materiais do CDN
- parse do payload inicial como se ele já trouxesse a sequência completa

Essa hipótese já foi levada ao limite útil.

## O que precisa ser executado

A próxima fase precisa usar automação de navegador com captura real de rede.

Ferramenta recomendada:

- Playwright

Capacidades mínimas:

1. abrir a URL do episódio
2. esperar a hidratação do viewer
3. capturar requests e responses
4. registrar requests dos domínios:
   - `sp.manga.nicovideo.jp`
   - `manga.nicovideo.jp`
   - `deliver.cdn.nicomanga.jp`
5. identificar qual resposta entrega:
   - frames
   - imagens
   - metadados de corte
   - ordem de leitura

## Critérios mínimos de sucesso

A fase só deve ser considerada concluída se produzir:

1. pelo menos uma request que exista apenas após hidratação do viewer
2. a resposta que representa a leitura real além do HTML inicial
3. a definição da unidade real de leitura:
   - frame
   - imagem inteira
   - imagem com cortes
4. uma estratégia objetiva para alimentar o `/reader`

## Saída esperada

A execução dessa fase deve gerar um artefato final com:

- lista de requests relevantes
- status HTTP
- tipo de recurso
- payload resumido
- campos importantes encontrados
- URLs reais de leitura, se existirem
- regra de ordenação
- mapeamento final para o reader

## Conclusão operacional

O ManiacReader está pronto para sair da fase de investigação por HTML.

A única continuação tecnicamente correta agora é:

**interceptação real de rede do viewer com browser automation.**
