# Levantamento — processo de projeto Trilha e Gestor de Projetos

Registro vivo da conversa de levantamento. Serve para qualquer chat retomar exatamente de onde parou.

## Objetivo

1. Documentar o processo de projeto da Trilha (vira o `MANUAL.md`).
2. Especificar o módulo **Gestor de Projetos** do app Gestão Trilha: um gestor do **processo** de projeto
   (escopo a produzir, etapas, desenhos, documentos, responsáveis), não um gestor financeiro.

## Decisões já tomadas

- (M5) Etapas: Briefing, Estudo Preliminar, Anteprojeto (3 fases), Projeto Executivo (2 fases), Projeto Legal em
  paralelo ao Anteprojeto. Compatibilização é atividade da fase 2 do Anteprojeto, não etapa.
- (M5) Cada etapa fecha com reunião, aceite e termo, exceto o Projeto Legal, que fecha com a aprovação.
- (M5) Hierarquia provisória: etapa > fase > entregável > tarefa.
- (M5) Três modelos de processo: do zero, reforma, interiores e marcenaria. Só o do zero está mapeado.
- Mapeamento consolidado com fontes: `MAPEAMENTO.md`.

- O Gestor de Projetos é focado no processo de projeto: painel por projeto, gerenciador dinâmico de etapas
  (da entrada no fluxo ao projeto executivo), acompanhamento do desenvolvimento e responsável por tarefa.
  Prazos, horas e honorários entram como consequência, integrados aos módulos existentes.
- Estrutura em três níveis: **Etapa → Entregável → Tarefa**.
  - Etapa: fase do processo, com critério de entrada e de saída (portão).
  - Entregável: o que a etapa produz (desenho, documento, modelo, apresentação); tem responsável, situação e prazo.
  - Tarefa: ação do dia a dia ligada a um entregável ou à etapa; tem responsável e prazo.
- O levantamento é feito por blocos, na ordem do processo; o material pode chegar bruto.
- Este registro evolui para o Manual de Processos Trilha (PDF para estudo de futuros colaboradores).

## Proposta inicial (a validar)

Fluxo rascunhado: 0. Entrada → 1. Estudo Preliminar → 2. Anteprojeto → (Projeto Legal, possivelmente em
paralelo) → 3. Compatibilização → 4. Projeto Executivo → 5. Encerramento / passagem para obra.
Apresentação tratada como portão de saída de cada etapa (apresentação → rodadas de ajuste → aceite).

Mecânicas propostas: projeto nasce de um modelo por tipo; situações do entregável (A fazer → Em desenvolvimento
→ Revisão interna → Pronto → Apresentado/Entregue, mais "Aguardando" terceiros); portões com checklist e
contagem de rodadas; responsável por entregável e tarefa, visível na área da pessoa; ligação opcional com o
cronômetro do Tempo. Telas: painel de todos os projetos (colunas por etapa), painel do projeto, bloco
"meus entregáveis e tarefas" na área da pessoa.

## Dúvidas em aberto

> Rodada 1 (abaixo) em parte respondida pelo M5. Estado atual e perguntas da rodada 2: ver `MAPEAMENTO.md` e a seção "Perguntas — rodada 2" no fim deste arquivo.


1. A lista de etapas representa o processo da Trilha? Apresentação como portão (e não etapa própria)?
   Projeto Legal no fluxo ou em paralelo?
2. Entregável por grupo de desenhos/documento (com checklist interno opcional) em vez de prancha a prancha?
3. Tarefas de projeto ficam no projeto e aparecem na área da pessoa, sem duplicar a aba Tarefas (agenda pessoal)?
4. Material existente: lista de pranchas padrão, checklists de entrega, modelo de cronograma.

## Blocos do levantamento

| # | Bloco | Situação |
|---|---|---|
| 0 | Visão geral | parcial — 3 modelos de processo; identidade vem da proposta |
| — | Análise de briefing, proposta, contrato e exportação do PE (M1–M4) | síntese feita, a validar |
| 1 | Entrada do projeto | coberto (residencial do zero) |
| 2 | Fluxo de etapas | coberto (do zero) |
| 3 | Entregáveis por etapa | parcial |
| 4 | Padrões Trilha | parcial |
| 5 | Complementares e terceiros | bem coberto |
| 6 | Pessoas e papéis | parcial |
| 7 | Variações por tipo de projeto | só a divisão em 3 modelos |
| 8 | Dores atuais | não aberto |

## Material recebido

| # | Material | Data | Observação |
|---|---|---|---|
| M1 | Briefing inicial residencial (Google Forms respondido) | set/2025 | Projeto de referência "Residência 287 m²" |
| M2 | Proposta de serviço — Projeto Residência | ago/2025 | Mesmo projeto |
| M3 | Contrato de prestação de serviço + Anexo 01 (Plano de Projeto) | ago/2025 | Mesmo projeto |
| M4 | Print da lista de PDFs exportados de um Projeto Executivo | — | Projeto "Lodges Cipó" |
| — | Apresentação do Estudo Preliminar | — | **não chegou** (anunciada, sem anexo) |
| M5 | Levantamento por voz (resumo do chat de levantamento) | 25–26/09/2026 | Blocos 0–2 e 5 cobertos; 3, 4, 6, 7 parciais; 8 não aberto |
| — | Template ArchiCAD, cronogramas, lista completa de IDs, termos de etapa | — | citados no M5, **não recebidos** |

Os arquivos não ficam no repositório (dados pessoais e cláusula de sigilo). Aqui só a síntese do processo.

## Síntese do material M1–M4 (a validar)

### Caminho de um projeto, como aparece nos documentos

1. **Contato → Briefing inicial** (formulário Google, "para desenvolver um orçamento"). Seções: identificação;
   uso da residência; metragem e "espacialidade" (compacta/confortável/espaçosa); terreno (área, topografia);
   pavimentos; moradores e pets; acessibilidade; expectativas sobre a casa e sobre o serviço; programa por setor
   (social, íntimo, serviço, garagem, lazer); especificidades por ambiente (cozinha, jantar, estar/TV,
   dormitórios, banhos, lavabo, lavanderia, gourmet, piscina); itens "soltos" (leitura, fogueira, lareira…);
   execução (prazo, sistema construtivo); estética (minimalista/expressiva/rústica-brutalista) e materiais;
   relação com exterior, paisagismo e rua; técnicos (solar, reúso, ar, aquecimento, automação); quem executa a
   obra; investimento e padrão por m² com referência ao CUB.
2. **Proposta** (apresentação institucional + "Sua demanda" + **Programa de Necessidades** com áreas por setor,
   +10% circulação, +10% paredes/estrutura + **Processo de Projeto** + **Plano de Projeto** + estimativa de custo
   de obra por padrão + investimento + serviços extras: interiores, marcenaria, execução/administração e
   fiscalização de obra).
3. **Contrato**: o escopo repete "Sua demanda" e o programa; etapas, prazos, pré-requisitos, honorários,
   obrigações, direitos autorais, aditivos; **Anexo 01 = Plano de Projeto** (lista de pranchas/documentos por etapa).
4. **Execução das etapas** com **Termo de Encerramento de Etapa** assinado pelo cliente ao fim de cada uma, e
   **Termo de Finalização de Projeto** na entrega do Executivo.

### Etapas da Trilha (proposta e contrato)

| Etapa | Pré-requisito para começar | Conteúdo | Prazo contratual (dias úteis) | Saída |
|---|---|---|---|---|
| 01 Briefing | — | ideias, desejos, rotina, investimento | — | programa de necessidades |
| 02 Estudo Preliminar (EP) | contrato assinado, 1ª parcela paga, levantamento topográfico planialtimétrico | estudos → concepção → desenhos → apresentação | até 40 p/ 1ª apresentação; 15 p/ revisões pontuais; 30–40 p/ revisão total | 1 revisão total inclusa; Termo de Encerramento |
| 03 Anteprojeto (AP) | Termo de Encerramento do EP | **3 momentos:** (a) revisão e ajustes + lançamento técnico (estrutura, pontos hidro/elétricos, pluvial) → libera complementares e Projeto Legal; (b) **compatibilização** (estrutural 15 d.u.; demais 10 d.u.); (c) **definições** de acabamentos, equipamentos e revestimentos com o cliente → finalização (15 d.u.) | 20–30 + 15 + 10 + 15 | Termo de Encerramento |
| PL Projeto Legal (paralelo) | documentos do cliente; ajustes do AP concluídos; lançamento estrutural pelo engenheiro | pranchas de aprovação, protocolo, acompanhamento até aprovar | 20 p/ desenvolver e protocolar; depois depende do órgão | aprovação |
| 04 Projeto Executivo (PE) | Termo de Encerramento do AP (e aprovações necessárias) | desenhos, detalhamento, documentação, entrega; **sem alterações do cliente** | 40–60 | entrega digital + física; Termo de Finalização |
| Obra (serviço à parte) | — | administração (12% do custo) ou fiscalização | — | — |

Regras de prazo relevantes para o app:
- Prazos só contam depois de cumprido o pré-requisito.
- **Não contam** os períodos de espera: análise do cliente, definições do cliente, complementares, órgão de aprovação.
- Retenção pelo cliente > 20 dias úteis → projeto **suspenso**; reativação em até 20 dias úteis.
- Estrutural e fundações são **obrigatórios**; sem contratação o projeto é suspenso. Demais complementares recomendados.
- Indefinição de acabamentos pelo cliente → Trilha especifica e segue.
- Troca com complementares em BIM (ArchiCAD, .pln/.ifc); cliente recebe PDF; BIMx após o EP.
- Pesos por etapa (rescisão): EP 50%, AP 25%, PE 25%.
- Aditivos (cláusula 9): 2ª revisão total do EP = 20%; após aceite: pequenas 0–2% (AP) / 0–5% (PE);
  maiores 0–10% (AP) / 0–20% (PE); grandes → negociação específica.

### Plano de Projeto = escopo de entregáveis

O Plano de Projeto (proposta pág. 18–20 e Anexo 01 do contrato) já é a lista de entregáveis por etapa:
- **EP:** estudo de concepção, implantação/cobertura, plantas por pavimento, corte, perspectiva explodida,
  estudos de insolação, ventilação e visuais, perspectiva estrutural, perspectiva de terraplenagem,
  imagens fotorrealistas, animação, modelo BIMx.
- **AP:** terraplenagem (planta e perspectiva), implantação/cobertura, plantas, cortes, fachadas, mapeamentos
  (piso e acabamento, pontos hidrossanitários, pontos elétricos, forro e iluminação — por pavimento), modelo 3D
  do lançamento estrutural, especificação de acabamentos, especificação de louças e metais, BIMx.
- **PL:** situação/implantação, cobertura, plantas, plantas de áreas, cortes longitudinal e transversal.
- **PE:** tudo do AP detalhado + cobertura, **ampliações** (cozinha, lavanderia, banhos, SPA, quintal,
  escadas…), **esquadrias** (alumínio e vidro, madeira, guarda-corpo e corrimão), perspectivas isométricas,
  imagens atualizadas, especificações, índice de projeto, BIMx.
- Quantitativo mínimo declarado: EP 24 · AP 31 · PL 8 · PE 58 (o PE cresce durante o desenvolvimento).
- O Plano é preliminar; a Trilha pode alterá-lo.

### Numeração de pranchas (Plano de Projeto e print M4)

Séries por centena: **100** implantação, terraplenagem, cobertura e plantas · **200** cortes · **300** fachadas ·
**400** mapeamentos (piso/acabamentos, hidro e gás, elétrica e climatização, iluminação, forro, elevações de
iluminação, cobertura) · **500** ampliações e detalhamentos · **600** esquadrias.
Um número = uma prancha, que pode conter mais de um desenho ("201 — Cortes AA e BB").
Nome do arquivo exportado: `NNN_TR_<PROJETO>_<DISCIPLINA>_<ETAPA> - <TÍTULO DA PRANCHA>.pdf`
(ex.: `201_TR_<PROJETO>_ARQ_PE - CORTES AA E BB.pdf`).

### Pontos de atenção encontrados (para o bloco 4 — Padrões)

1. No Plano de Projeto os itens do **EP estão codificados "AP01…AP15"**, a mesma sigla do Anteprojeto.
2. O quantitativo mínimo do EP (24) não bate com os 15 itens listados (talvez contando imagens individualmente).
3. No print há **dois arquivos "100"** (rua elétrica/iluminação e rua interna) e a série 500 mistura número de
   prancha e número de ampliação ("501 — Ampliação 04 e 05", "505 — Ampliação 04").
4. O código do projeto no nome do arquivo tem **acentos** (ex.: "CIPÓGERÔNIMO"), o que costuma dar problema em
   e-mail, zip, nuvem e alguns programas.
5. O contrato tem numeração repetida de itens (2.3.3 e 2.4.5 duas vezes) — revisar no modelo.
6. O app hoje trata **Compatibilização como etapa**; no processo da Trilha ela é o **2º momento do Anteprojeto**.
   O app também não tem a etapa **Briefing**.

### Implicações para o Gestor de Projetos (a validar)

- **Portão = Termo de Encerramento de Etapa.** O app registra o aceite (data, quem assinou, arquivo/link).
- **Pré-requisitos do contrato viram checklist de entrada** de cada etapa (ex.: EP só começa com contrato,
  1ª parcela e topográfico).
- **Prazo contratual com relógio que pausa:** a contagem em dias úteis para enquanto o projeto está
  "Aguardando" cliente, complementares ou órgão, exatamente como a cláusula 3.2; alerta de "suspensão"
  após 20 dias úteis de retenção.
- **Anteprojeto com três momentos** (Ajustes → Compatibilização → Definições), cada um com prazo próprio.
- **Plano de Projeto é o modelo de entregáveis:** o projeto nasce com a lista do Plano (por tipo de projeto);
  cada item é uma prancha/documento com número, título, etapa, responsável e situação. O mesmo cadastro pode
  gerar o Anexo 01 do contrato e, no fim, o índice de projeto e os nomes dos arquivos exportados.
- **Registro de revisões e alterações** com a classificação da cláusula 9 (pequena/maior/grande) e a faixa de
  aditivo sugerida conforme a etapa.
- **Lista de definições do cliente** no AP (acabamentos, louças e metais, equipamentos, revestimentos),
  com prazo; vencido o prazo, a Trilha define (cláusula 2.2.7).
- **Complementares** por disciplina: contratado? por quem? recebido? compatibilizado? Estrutural obrigatório.
- A ficha do projeto aproveita o briefing e o programa de necessidades (áreas por setor).

## Perguntas — rodada 2

### A. Divergências entre a voz e os documentos (confirmar qual vale)
1. Marco zero: contrato + topográfico + **documentos** (voz) ou contrato + topográfico + **1ª parcela paga** (contrato)? Ou os quatro?
2. "Briefing": é etapa do projeto (proposta: etapa 01) ou fase comercial até o contrato (voz)? Como chamar cada parte?
3. Lançamento de estrutura e de pontos: fase 1 (proposta e contrato) ou fase 2 (voz) do Anteprojeto?
4. Nome do termo: "finalização de etapa" (voz) ou "encerramento de etapa" (contrato)?
5. A proposta promete "quantitativos gerais" no Executivo; pela voz, não há quantitativo total. Qual é o compromisso?
6. A exceção do cliente ansioso no Projeto Legal deve entrar no contrato, com ciência do risco?
7. Papel da Elisa: a proposta já a apresenta como diretora de projetos e responsável técnica. Como descrever hoje?

### B. Bloco 1 — Entrada
8. A visita ao terreno gera algum registro (fotos, medidas, checklist)?
9. Quanto tempo dura, em média, do primeiro contato até o contrato?
10. Qual é o prazo que o cliente tem para entregar topográfico e documentos depois do contrato? O que acontece se atrasar?
11. Quem monta a proposta e quem apresenta?
12. O que acontece quando o cliente não fecha? Fica algum registro?

### C. Bloco 2 — Fluxo (pontos em aberto)
13. Aceites pontuais no Anteprojeto: como são dados hoje (WhatsApp, e-mail, reunião)? Ficam registrados?
14. Ajustes pontuais do EP: deveria haver um limite? Qual?
15. Revisão interna antes de apresentar: só o Luan ou também a Elisa? Em quais momentos?
16. Na reunião final do Executivo, se o cliente pedir alteração: aplica-se o aditivo da cláusula 9?
17. O Executivo tem algum marco intermediário com o cliente, ou só a entrega final?
18. Existe um cronograma padrão por etapa que vocês usam (vocês citaram cronogramas)?

### D. Bloco 3 — Entregáveis
19. O Plano de Projeto é montado do zero em cada proposta ou parte de um modelo?
20. No app, cada entregável é uma **prancha** (como no Plano) ou um **grupo** (ex.: "Mapeamentos")?
21. Há entregáveis que não são pranchas (estudos, renders, animação, BIMx, listas, caderno)? Quais são sempre obrigatórios?
22. O que compõe a apresentação do EP (ordem, conteúdo)? Enviar um exemplo.
23. O que compõe o caderno de obra e o índice de projeto?

### E. Bloco 4 — Padrões
24. Enviar a lista completa de IDs de pranchas (séries 100 a 600 e outras).
25. Como é o código do projeto no nome do arquivo? Quem define? Pode ficar sem acentos?
26. Revisões: vocês usam R00, R01…? Onde a revisão aparece (carimbo, nome do arquivo)?
27. Estrutura da pasta padrão: enviar print ou lista das subpastas.
28. Template ArchiCAD: o que já vem pronto (aba de informações, legislação, layouts, carimbo)?
29. Os seis pontos de padronização encontrados nos documentos (ver `MAPEAMENTO.md` §5): corrigir?

### F. Bloco 5 — Complementares
30. Quantas rodadas de compatibilização costumam acontecer? Como as interferências são registradas hoje?
31. Vocês pedem prazo aos engenheiros? O que fazem quando atrasam?
32. Quem fala com os engenheiros: Luan, Elisa ou os dois?

### G. Bloco 6 — Pessoas e papéis
33. Em cada etapa, quem faz, quem revisa e quem aprova?
34. Quem fala com o cliente em cada momento?
35. Quem emite o RRT de projeto?
36. Quando entrar um colaborador, o que ele faria primeiro? O que continua só com os sócios?

### H. Bloco 7 — Variações (depois do "do zero")
37. Reforma: o que muda na entrada (levantamento cadastral, as built)? Quais etapas existem?
38. Interiores e marcenaria: quais etapas e entregáveis? Como se conecta a um projeto de arquitetura da Trilha?
39. Restaurante, pousada e institucional seguem o mesmo fluxo do residencial? O que muda?

### I. Bloco 8 — Dores
40. Em que momento do processo vocês mais perdem tempo?
41. O que já foi esquecido ou refeito em algum projeto?
42. Qual informação vocês procuram com frequência e demoram para achar?
43. Quais esperas mais atrasam: cliente, engenheiros, condomínio ou prefeitura?
44. O que você gostaria de ver num relance sobre todos os projetos?
45. Onde a comunicação com o cliente mais gera retrabalho?
