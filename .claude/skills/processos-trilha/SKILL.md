---
name: processos-trilha
description: Processo de trabalho e serviços da Trilha Arquitetura Brasileira — etapas do projeto (Abertura, Estudo Preliminar, Anteprojeto, Projeto Legal, Executivo, marcenaria), entregáveis e Plano de Projeto, prazos e portões, termos, contrato e aditivos, complementares, papéis, especificação, registros e os documentos de processo (Mapeamento, Manual da equipe, Caminho do Projeto para o cliente) em PDF com a identidade Trilha. Use sempre que o pedido for sobre como o escritório trabalha, revisar ou criar documentos de processo, ajustar o contrato ou a proposta ao processo, ou levantar e organizar novos processos de serviço da Trilha. Não é para o app Gestão Trilha (esse tem a skill gestao-trilha).
---

# Processos da Trilha Arquitetura Brasileira

Escritório de arquitetura de Juiz de Fora (MG). Sócios: **Luan** (fundador) e **Elisa**. Contato: trilha@trilhaarq.com.br.
Este conjunto reúne todo o levantamento do processo de projeto e do comercial (25/09 a 03/10/2026), sem
configuração de app. O app de gestão (Gestão Trilha) tem chat e skill próprios (`gestao-trilha`).

## Onde está cada coisa

| Arquivo | O que tem |
|---|---|
| `referencias/MAPEAMENTO.md` | **Base do processo** (v3, 28/09/2026): papéis, entrada do projeto, fluxo e etapas, prazos, espera e suspensão, alterações e aditivos, entregáveis, padrões, complementares e aprovações, variações por tipo, dores, encerramento e passagem para obra, e §11 pauta de revisão do contrato |
| `referencias/DECISOES-PROCESSO.md` | Decisões **mais novas** (29/09 a 03/10): Abertura, Plano de Projeto por etapa, marcenaria, suspensão/arquivamento, termos com anotações, reuniões, histórico e registros de acontecimentos, especificação, notificações. **Prevalece sobre o Mapeamento** quando diferente |
| `referencias/COMERCIAL-CONTRATOS-PROPOSTAS.md` | Captação (8 etapas), briefing, estrutura e texto da proposta, lógica de preço, os **7 modelos de contrato**, prazos por tipo e pesos (01–03/10/2026) |
| `referencias/APP-VISAO-GERAL.md` | O app Gestão Trilha em uma página: o que cada parte faz no processo (sem configuração) |
| `referencias/TERMOS.md` | Textos dos termos (Encerramento de Etapa, Encerramento de Projeto, Ciência de Antecipação) |
| `referencias/processo-trilha.json` | O processo em dados estruturados (etapas, modelos, marco zero, termos, espera, aditivos, pranchas, complementares, papéis, programa de necessidades, categorias, pendências) |
| `referencias/LEVANTAMENTO.md` | Registro histórico das rodadas de perguntas e respostas |
| `referencias/FORMATO-DOCUMENTOS.md` | Os três documentos em PDF: público, conteúdo, identidade visual e como gerar |
| `documentos/` | PDFs v1 (Mapeamento, Manual, Caminho do Projeto) e `fonte/` (HTML, CSS, fontes, logo, `render.js`) |

## Fontes e regras de decisão

- Marcar a origem das informações: **[V]** voz/fala do Luan · **[C]** contrato e Anexo 01 · **[P]** proposta de serviço ·
  **[B]** formulário de briefing · **[X]** print de exportação de executivo.
- **Em conflito entre o que o Luan disse e o contrato, vale o contrato.** Só voltar ao Luan o conflito grande. O que
  exige mudar o contrato entra na pauta de revisão (MAPEAMENTO §11).
- Decisão mais nova vale sobre a mais antiga (COMERCIAL-CONTRATOS-PROPOSTAS.md > DECISOES-PROCESSO.md >
  MAPEAMENTO.md > LEVANTAMENTO.md).
- Tudo é **padrão editável**, nada é rígido. Critério para qualquer ferramenta ou rotina: **poucos cliques**
  (a ferramenta Volbi falhou por ser complexa demais).
- **Confidencialidade:** o contrato tem cláusula de sigilo. Não publicar dados pessoais de clientes (CPF, endereço)
  em materiais gerais; nos documentos de processo, usar exemplos sem dados pessoais.

## Como trabalhar com o Luan

- Português do Brasil, linguagem de arquiteto e gestor (não de programador).
- **Uma linha de resposta direta antes dos detalhes**; tópicos curtos; justificar análises com fonte ou raciocínio.
- **Não introduzir tópicos novos sem perguntar.** Recomendar em vez de listar opções sem posição.
- Quando ele disser "só receba" ou "não processe", apenas registrar (em DECISOES-PROCESSO.md ou num arquivo de
  revisões) e responder curto, sem gerar material.
- O Luan costuma mandar áudios transcritos: interpretar a intenção, sem se prender a repetições da fala.

## Materiais de processo

1. **Mapeamento do processo** (para os sócios): tudo, inclusive administrativo, contrato, dinheiro, dores,
   melhorias e pendências.
2. **Manual do processo** (para a equipe): formal e direto, sem administrativo nem contrato.
3. **Caminho do Projeto** (para o cliente): guia visual das etapas, para reduzir a ansiedade. Não confundir com o
   Guia de Projeto (entregável do Executivo).
Ao atualizar um deles: editar o HTML em `documentos/fonte/`, subir versão e data, gerar o PDF (ver
FORMATO-DOCUMENTOS.md) e conferir as páginas como imagem antes de entregar.

## Pendências conhecidas

- Contratos revisados em 30/09 (modelos 01–06) e 07 em 02/10 (falta revisão jurídica): conferir quais itens da
  MAPEAMENTO §11 entraram (antecipação, nomes dos termos, alteração no Legal).
- Materiais a receber/produzir: pasta padrão, template ArchiCAD, exemplos de EP e Executivo, guias em PDF por
  desenho, "Como fazer marcenaria na Trilha", revisão final dos textos dos termos.
- Detalhar os processos de Reforma e de Interiores/Marcenaria (hoje só as diferenças macro, MAPEAMENTO §7).
- Revisão do formulário de briefing (faixas de padrão, ambientes que faltam, gourmet com várias opções).
- Calibrar horas de referência e fatores de preço com horas reais.
- Especificação: biblioteca de itens padrão e listas por projeto (DECISOES §7).
