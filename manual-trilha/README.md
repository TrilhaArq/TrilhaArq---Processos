# Manual de Processos Trilha

Documento-mestre de como a **Trilha Arquitetura Brasileira** trabalha. Tem dois usos:

1. **Pessoas:** material de estudo para quem entra na equipe entender o processo sem depender de explicação oral.
   Será exportado em PDF com a identidade visual Trilha.
2. **Apps:** base de regras para os módulos do app Gestão Trilha (especialmente o Gestor de Projetos).
   O manual descreve o processo; o app implementa o que está aqui. Se os dois divergirem, o manual é revisado primeiro.

## Estrutura

| Arquivo | Conteúdo | Situação |
|---|---|---|
| `MANUAL.md` | Esqueleto inicial do manual (substituído por `pdf/fonte/manual.html`) | histórico |
| `LEVANTAMENTO.md` | Registro do levantamento: material recebido, decisões tomadas, dúvidas em aberto | em andamento |
| `MAPEAMENTO.md` | Mapeamento completo do processo, com fontes (texto-base dos PDFs) | v3 |
| `processo-trilha.json` | Dados estruturados do processo para o app | v3 |
| `pdf/Mapeamento-Processo-Trilha.pdf` | Material 1: mapeamento para os sócios | v1 |
| `pdf/Manual-Processo-Trilha.pdf` | Material 2: manual para a equipe (sem administrativo nem contrato) | v1 |
| `pdf/Caminho-do-Projeto-Trilha.pdf` | Material 3: guia visual para o cliente | v1 |
| `pdf/fonte/` | HTML e script para regenerar os PDFs (`node render.js`, com Playwright) | — |

## Como evolui

- O levantamento acontece por blocos (ver `LEVANTAMENTO.md`). Ao fim de cada bloco validado, o conteúdo
  vira texto definitivo no capítulo correspondente do `MANUAL.md`.
- Linguagem: português do Brasil, frases curtas, escrito para um arquiteto recém-chegado ao escritório.
- Cada capítulo termina com "Como aparece no app", quando houver relação com o Gestão Trilha.
