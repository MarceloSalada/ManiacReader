# Tools Handoff

Esta pasta concentra a próxima fase real do ManiacReader fora do fluxo simples do app Next.js.

## Arquivos-base atuais

- `viewer-network-probe.example.ts`
- `viewer-network-probe.example.mjs`
- `viewer-network-probe.mjs`

## Finalidade

Esses arquivos existem para iniciar a fase de automação real do viewer do Nico Nico Manga.

O probe real deve ser usado para:

1. abrir a URL do episódio em navegador automatizado
2. interceptar requests e responses
3. descobrir a origem real dos frames, imagens ou metadados de corte
4. produzir um relatório que permita alimentar o `/reader`

## O que esta pasta não é

- não é parte da UI do projeto
- não é parte do fluxo atual da Vercel Hobby
- não resolve a leitura final sem browser automation real

## Comandos

Stub atual:

```bash
npm run probe:viewer:stub
```

Probe real desta fase:

```bash
npm run probe:viewer
```

Com URL explícita:

```bash
node tools/viewer-network-probe.mjs "https://sp.manga.nicovideo.jp/watch/mg197350"
```

## Dependência necessária

O probe real usa import dinâmico de `playwright`.

Se o pacote não estiver instalado no ambiente, o script vai interromper e instruir:

```bash
npm install -D playwright
```

## Saída esperada

Ao rodar com sucesso, o script gera:

- `probe-report.json`

Esse arquivo traz:

- requests interceptadas
- responses interceptadas
- `content-type`
- `status`
- trechos de payload quando possível
- classificação básica de cada resposta

## Regra importante

Não voltar para novas tentativas de deduzir a leitura completa apenas pelo HTML inicial.

Essa etapa já foi encerrada no projeto.
