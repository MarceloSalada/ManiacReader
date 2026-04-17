# Tools Handoff

Esta pasta concentra a próxima fase real do ManiacReader fora do fluxo simples do app Next.js.

## Arquivo-base atual

- `viewer-network-probe.example.ts`

## Finalidade

Esse arquivo existe para iniciar a fase de automação real do viewer do Nico Nico Manga.

Ele deve ser usado para:

1. abrir a URL do episódio em navegador automatizado
2. interceptar requests e responses
3. descobrir a origem real dos frames, imagens ou metadados de corte
4. produzir um relatório que permita alimentar o `/reader`

## O que esta pasta não é

- não é parte da UI do projeto
- não é parte do fluxo atual da Vercel Hobby
- não resolve a leitura final sem browser automation real

## Próximo uso recomendado

Quando a fase de automação for iniciada, o caminho correto é:

1. copiar ou adaptar `viewer-network-probe.example.ts`
2. ligar Playwright em ambiente apropriado
3. executar contra a URL-alvo do episódio
4. registrar requests/responses dos domínios de interesse
5. salvar um relatório final de achados

## Regra importante

Não voltar para novas tentativas de deduzir a leitura completa apenas pelo HTML inicial.

Essa etapa já foi encerrada no projeto.
