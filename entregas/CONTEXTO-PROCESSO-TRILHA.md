# Contexto — Processos da Trilha Arquitetura Brasileira

Arquivo único para iniciar um chat dedicado ao processo do escritório (gerado em 03/10/2026).
Ordem: 1 regras do chat · 2 decisões mais novas · 3 mapeamento completo · 4 textos dos termos · 5 formato dos documentos.
Os nomes de arquivo citados abaixo (MAPEAMENTO.md, DECISOES-PROCESSO.md…) correspondem às partes deste mesmo arquivo; os PDFs e o HTML de origem ficam no pacote processos-trilha (zip) e no GitHub (TrilhaArq/TrilhaArq---Processos).

---

# 1. Regras deste chat

Escritório de arquitetura de Juiz de Fora (MG). Sócios: **Luan** (fundador) e **Elisa**. Contato: trilha@trilhaarq.com.br.
Este arquivo reúne todo o levantamento do processo de projeto feito de 25/09 a 03/10/2026, sem nada de
configuração de app. O app de gestão (Gestão Trilha) tem chat e skill próprios (`gestao-trilha`).

## Onde está cada coisa

| Arquivo | O que tem |
|---|---|
| `referencias/MAPEAMENTO.md` | **Base do processo** (v3, 28/09/2026): papéis, entrada do projeto, fluxo e etapas, prazos, espera e suspensão, alterações e aditivos, entregáveis, padrões, complementares e aprovações, variações por tipo, dores, encerramento e passagem para obra, e §11 pauta de revisão do contrato |
| `referencias/DECISOES-PROCESSO.md` | Decisões **mais novas** (29/09 a 03/10): Abertura, Plano de Projeto por etapa, marcenaria, suspensão/arquivamento, termos com anotações, reuniões, histórico e registros de acontecimentos, especificação, notificações. **Prevalece sobre o Mapeamento** quando diferente |
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
- Decisão mais nova vale sobre a mais antiga (DECISOES-PROCESSO.md > MAPEAMENTO.md > LEVANTAMENTO.md).
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

- Revisão do contrato com os ajustes da MAPEAMENTO §11 (inclui antecipação, nomes dos termos, alteração no Legal,
  marcenaria como contrato próprio).
- Materiais a receber/produzir: pasta padrão, template ArchiCAD, exemplos de EP e Executivo, guias em PDF por
  desenho, "Como fazer marcenaria na Trilha", revisão final dos textos dos termos.
- Detalhar os processos de Reforma e de Interiores/Marcenaria (hoje só as diferenças macro, MAPEAMENTO §7).
- Processo comercial (captação/oportunidades e briefing) a mapear.
- Especificação: biblioteca de itens padrão e listas por projeto (DECISOES §7).

---

# Decisões de processo tomadas depois do Mapeamento v3 (29/09 a 03/10/2026)

Decisões do Luan que mudam ou completam o MAPEAMENTO.md. Em caso de diferença, **vale este arquivo** (é mais novo).
Continua valendo: em conflito entre o que o Luan disse e o contrato, vale o contrato, e o que precisa mudar no
contrato vai para a pauta de revisão (MAPEAMENTO §11).

## 1. Etapas do projeto

- Fluxo: **Abertura → Estudo Preliminar → Anteprojeto → Projeto Executivo → Encerramento**.
  Projeto Legal corre em paralelo ao Anteprojeto. Reforma e Interiores pulam Anteprojeto e Legal.
- **Abertura** (nome escolhido pelo Luan) é a etapa entre o contrato e o marco zero. Itens:
  receber o levantamento topográfico · receber documentos do cliente (pessoais, registro, IPTU) · duplicar a pasta
  padrão · criar o arquivo ArchiCAD pelo template · preencher dados do cliente e do terreno · análise de legislação
  · **modelar o terreno** (importar o topográfico, curvas e platôs, conferir níveis e divisas).
- Marco zero (início do EP): contrato assinado + 1ª parcela paga + topográfico + itens da Abertura.
  Exceção: antecipação, só com **Termo de Ciência de Antecipação** assinado. AP → Executivo: Legal aprovado,
  **sem exceção**.
- O Anteprojeto tem 3 fases: 1 revisão e lançamentos · 2 compatibilização · 3 definições.
  O Executivo tem 2 fases: 1 desenhos base · 2 mapeamentos e detalhamento.
- **Briefing não é etapa do projeto.** Faz parte da captação (oportunidade comercial): contato, briefing,
  proposta, reunião de apresentação, contrato, 1ª parcela. O projeto só "nasce" quando a oportunidade é fechada.
  Captação é assunto dos sócios (Luan e, no máximo, Elisa). As horas de captação são do comercial, não do projeto.

## 2. Plano de Projeto (o que se produz em cada etapa)

- O "Plano de Projeto" é a lista de entregáveis; cada entregável principal é uma **prancha** com seus desenhos
  (subitens), cada desenho com checklist e um PDF-guia do procedimento.
- **Estudo Preliminar**, organizado pela apresentação:
  - estudos: análise do terreno e condicionantes (insolação, ventilação, chuva, visuais, legislação), partido,
    modelo 3D, estrutura preliminar;
  - material da apresentação (código AP): estudo de concepção, implantação/cobertura, plantas por pavimento, corte AA,
    perspectiva explodida, estudos de insolação, ventilação e visuais, perspectiva estrutural, perspectiva de
    terraplenagem, imagens fotorrealistas, animação (bônus), modelo BIMx;
  - apresentação (PDF widescreen: capa, imagem impactante, análise do terreno, esquemas de concepção, imagens,
    plantas e cortes, mais imagens, esquemas e diagramas, imagens finais), revisão interna, reunião de apresentação,
    rodadas de ajuste 1 e 2.
- **Anteprojeto:** séries 100 (implantação, plantas, cobertura), 200 (cortes), 300 (elevações), 400 (mapeamentos:
  topografia e terraplenagem; piso e acabamento, hidrossanitário, elétrica, forro e iluminação por pavimento;
  cobertura). **As séries 100 a 400 se repetem no Executivo**, com outro checklist.
  - Complementares, por disciplina (estrutural, hidrossanitário, elétrico, SPDA, climatização): envio ao
    complementar → reunião 1 → reunião 2 → conclusão.
  - Definições com o cliente: acabamentos e revestimentos, louças e metais, equipamentos, forro e iluminação final,
    bancadas, esquadrias.
  - Encerramento: revisão interna, reunião final com o cliente.
- **Projeto Legal:** pranchas de aprovação (código PL: situação/implantação, cobertura, plantas, plantas de áreas,
  cortes) e trâmite (documentos, condomínio, protocolo, exigências, aprovação/alvará).
- **Executivo:** séries 100 a 800 e 1000 (500 ampliações de áreas molhadas e especiais, 600 esquadrias,
  700 marmoraria, 800 detalhamentos, 1000 documentos). Fechamento: revisão final das pranchas, **Guia de Projeto**,
  imagens renderizadas atualizadas, modelo BIMx atualizado, reunião de entrega (abrir as pranchas), entrega física.
- **Os termos não são itens de checklist:** são documentos gerados no fim da etapa (ver §5).
- Códigos: série + posição (101, 102…); AP01… no material de apresentação; PL01… no Legal.

## 3. Marcenaria (Interiores)

- Serviço contratado **à parte**, junto com a arquitetura ou depois (contrato próprio). **Não vira outro projeto**:
  segue dentro do mesmo projeto, como uma segunda trilha.
- Duas etapas: **Estudo Preliminar da marcenaria** (desenhos, discussão dos móveis) → aprovado →
  **Executivo da marcenaria**. Série 900 = marcenaria (como no ArchiCAD).
- Regras de início:
  - EP da marcenaria: contrato da marcenaria assinado + 1ª parcela paga. Corre em paralelo à arquitetura.
  - Executivo da marcenaria: precisa do **Executivo arquitetônico encerrado E do EP da marcenaria encerrado**.
    Se o EP da marcenaria não terminou, o Executivo dela não começa com o fim da arquitetura.
- O termo final da arquitetura encerra só o **projeto arquitetônico**; a marcenaria continua até o termo dela.
- Os móveis **não** são previstos de antemão (cada marcenaria é personalizada; o cliente pode não fazer todos os
  ambientes). A equipe lança cada móvel usando um **modelo de móvel** padrão (editável):
  - desenhos: planta (vista superior), vistas frontais, cortes, detalhes (ferragens, puxadores, encaixes),
    tabela de materiais e acabamentos;
  - checklist: medidas conferidas com o projeto/obra, cotas totais e parciais, materiais/cores/fitas, ferragens e
    puxadores, eletros com medidas do fabricante, pontos elétricos e hidráulicos compatibilizados, folgas/rodapés/
    tamponamentos, revisão interna;
  - PDF de referência "Como fazer marcenaria na Trilha" (a produzir).
- Prazos da marcenaria são **combinados com cada cliente** (entrega por ambiente ou da casa toda) e definidos no
  contrato da marcenaria.

## 4. Prazos, espera, suspensão e arquivamento

- Prazos em dias úteis (EP 40, AP 70, Executivo 60 — padrão do contrato, ajustável por projeto). O prazo pausa
  enquanto o projeto aguarda alguém de fora da Trilha (cliente, engenheiro, condomínio, prefeitura).
- Cliente sem retorno: **aviso aos 15 dias úteis** (momento de cobrar o cliente); aos **20 dias úteis** o projeto
  vai **automaticamente para Suspensos** (cláusula 3.4). Suspenso não fica no fluxo de trabalho principal.
- Suspenso há **mais de 60 dias úteis** vai **automaticamente para Arquivados**.
- Atenção da equipe: alerta a partir de **10 dias úteis antes do fim do prazo** da etapa, que continua depois de
  vencido até ser resolvido.

## 5. Termos (documentos de etapa)

- Três termos: Encerramento de Etapa (EP, AP e EP da marcenaria), Encerramento de Projeto (Executivo e Executivo da
  marcenaria), Ciência de Antecipação. Textos em `TERMOS.md`.
- Gerados no fim da etapa, em PDF com a identidade da Trilha. Encerramento de Etapa e Ciência têm quadro de
  **anotações** opcional ("rever a posição do pilar junto com a estrutura"): as anotações **não reabrem** a etapa,
  são pontos para a próxima. Encerramento de Projeto não tem anotações.
- Nome no contrato atual: "Termo de Finalização de Projeto" (2.4.8); o nome novo vai para a revisão do contrato.

## 6. Reuniões, registros e histórico do projeto

- **Reuniões** (apresentação, ajustes, complementares, internas, entrega) contam como trabalho do projeto: marcadas
  com antecedência (aviso na véspera) e registradas depois com **duração, participantes, pauta e decisões**.
  O tempo de cada participante entra nas horas do projeto.
- **Histórico fiel do projeto:** tudo o que acontece fica registrado com **dia e hora** (etapas, termos, reuniões,
  pranchas concluídas, esperas, suspensões, alterações) e não se apaga; correção é um novo registro.
  Serve para responder questionamentos do cliente com dados (ex.: "esta etapa foi concluída em tal dia").
- **Registro de acontecimentos relevantes** (não é diário do dia a dia): pedido de alteração do cliente, revisão
  solicitada, decisão, aceite, reclamação, cliente que demorou a responder. Pode ser feito por texto ou voz.
  Motivação: cliente com muitas revisões (ex.: cinco, seis cozinhas desenhadas) reclamou que o projeto estava
  "de escanteio". Com os registros, sai um **relatório para o cliente**: pedidos de alteração e revisões por ambiente,
  tempo aguardando o cliente, reuniões, horas por etapa e linha do tempo. Marcar o que é candidato a aditivo (9.1).
  As rodadas de revisão estão sendo limitadas.
- Horas medidas por **prancha** (entregável principal), não por desenho.

## 7. Especificação (proposta aprovada para desenvolver)

- Cada projeto terá **listas de especificação**: revestimentos, louças e metais, iluminação, eletrodomésticos;
  outras conforme o projeto (espelhos, interruptores…).
- Base: uma **biblioteca de itens padrão da Trilha** (como os ambientes padrão). Na fase de especificação, a equipe
  marca os itens que costuma usar e eles entram no projeto; o item especificado guarda os dados do momento em que
  foi aprovado (se a biblioteca mudar depois, o projeto não muda sozinho).
- Já existe a especificação da Casa Motta (Paula e Bruno), feita em outro chat.

## 8. Notificações que a equipe precisa receber

1. Prazo da etapa chegando ao fim (10 d.u. antes; segue depois de vencido).
2. Cliente sem retorno há 15 d.u.
3. Contrato e 1ª parcela ok: projeto pronto para iniciar.
4. Abertura concluída: liberado para a concepção (para os sócios, que fazem a concepção).
5. Itens da etapa prontos: pronto para o termo.
6. Reunião no dia seguinte.
Quem recebe: sócios veem tudo; colaborador vê os projetos em que trabalha.

## 9. Programa de necessidades e identificação do projeto

- Mesma nomenclatura do briefing (para automação futura): dimensão Compacta / Confortável / Espaçosa; padrão nas
  5 faixas de preço do briefing; dificuldade do terreno baixa / normal / difícil / muito difícil.
- Áreas de referência do projeto-modelo (coluna Confortável); garagem 18 m² por vaga; editáveis em cada projeto.
- Código do projeto: RES / COM / HOT / REF / INT + nome curto, sem acento e sem número (ex.: RES-CASAMOTTA).
- Cliente é cadastro separado do projeto (um projeto pode ter vários clientes e um cliente, vários projetos).

## 10. Projetos já em andamento

- Ao organizar um projeto que já estava rodando, ele entra na etapa real, com as anteriores dadas como concluídas,
  e as datas reais são ajustadas depois. Exemplo: Casa Motta (RES-CASAMOTTA, contrato 68280825 de 28/08/2025) —
  Anteprojeto fase 2 (compatibilização), Abertura, EP e Legal concluídos; marcenaria contratada no Anteprojeto, com
  o EP da marcenaria quase no fim (proposta e contrato da marcenaria a receber).

---

# Mapeamento do processo de projeto: Trilha Arquitetura Brasileira

Versão 3, consolidada em 28/09/2026. Modelo mapeado em detalhe: **projeto do zero (residencial)**.
Reforma e Interiores/Marcenaria: só as diferenças macro (§7).
Dados estruturados do processo: `processo-trilha.json`.

**Materiais que este levantamento deve gerar** (definidos pelo Luan):
1. **Mapeamento do processo** (PDF, para o Luan): inclui administrativo, contrato, dinheiro, dores, melhorias e pendências. Base: este arquivo.
2. **Manual do processo** (para funcionários e estagiários): formal, direto; sem administrativo nem contrato; só como as coisas acontecem.
3. **Caminho do Projeto** (guia visual do cliente): etapas ligadas por setas, para reduzir a ansiedade. Não confundir com o Guia de Projeto.
4. **Ferramenta de gestão de projetos** (app Gestão Trilha): tratada em outro chat; aqui só o processo.

**Fontes:** [V] levantamento por voz com o Luan, versão 3 (25 a 28/09/2026) · [C] contrato e Anexo 01 ·
[P] proposta de serviço · [B] formulário de briefing · [X] print de exportação de um executivo.
**Regra de divergência (do Luan):** em conflito entre voz e contrato, **vale o contrato**. Só volta ao Luan
o conflito grande. Os ajustes que dependem de mudar o contrato estão na §11 (pauta de revisão do contrato).
**Marcas:** ✔C = resolvido pelo contrato · (sugestão) = proposta ainda não validada · [A CONFIRMAR] = falta dado.
Tudo aqui é **padrão editável**, nada é rígido.

---

## 1. A Trilha e papéis

- Escritório em Juiz de Fora (MG), fundado em novembro de 2020. [P]
- Missão, visão e valores: honestidade, respeito, qualidade, sustentabilidade, dedicação, pé no chão,
  "menos é mais". [P]
- Linguagem: brasileira e essencialista, com estrutura frequentemente aparente (pilares e vigas fazem parte da estética). [V][P]
- 100% BIM (ArchiCAD); renders no Lumion; o cliente recebe PDF e link BIMx. [V][C 7.3]

| Pessoa | Papel |
|---|---|
| **Luan** (fundador) | Comercial, administrativo, gestão, decisão final. Concepção, estrutura, lançamento de pontos, cobertura, pluvial, compatibilização. Único contato com cliente e complementares. Revisão final. [V] |
| **Elisa** | Diretora de Projetos e responsável técnica; **emite a RRT**. Hoje atua no desenvolvimento, sem comercial e sem contato com o cliente. [V][P] |
| Colaborador futuro | Desenhos e partes simples, com pouca decisão; cresce com a capacitação. [V] |

- Direção: a Elisa assume mais responsabilidade e o Luan passa a **demandar**. [V]
- Divisão atual por etapa [V]:
  - **EP:** a Elisa prepara topográfico, arquivo, terreno e estudo solar; o Luan faz a concepção; a Elisa finaliza 3D e imagens.
  - **AP:** revisão, estrutura e pontos com o Luan (a intenção é documentar os pontos para a Elisa assumir); acabamentos com Luan ou Elisa.
  - **PE:** a tendência é ficar mais com a Elisa.
- Apresentação do EP: o Luan conduz, com a Elisa incluída para assumir funções. [V]
- **Adiado:** o que fica só com os sócios. A decidir junto com as permissões de acesso. [V]

---

## 2. Entrada do projeto

| # | Passo | Fonte |
|---|---|---|
| 1 | Primeiro contato e atendimento | [V] |
| 2 | Visita ao terreno ou imóvel, com levantamento fotográfico | [V] |
| 3 | Briefing inicial (formulário) preenchido pelo cliente | [V][B] |
| 4 | Proposta: processo, demanda, programa de necessidades com áreas, plano de projeto, custo estimado da obra, valor. Montada e apresentada pelo Luan | [V][P] |
| 5 | Reunião de apresentação (a proposta é apresentada, não enviada) | [V] |
| 6 | Decisão do cliente (proposta válida por 30 dias) | [V][P] |
| 7 | Documentos: topográfico, documentos pessoais, registro do imóvel, IPTU | [V] |
| 8 | Contrato | [V][C] |
| 9 | Abertura interna: pasta padrão e arquivo ArchiCAD padrão (dados do cliente e do terreno, análise de legislação) | [V] |

- Duração média do contato ao contrato: cerca de 1 mês. Montar a proposta é lento (dor conhecida). [V]
- Cliente que não fecha: fica só o briefing e a proposta no Drive. [V]

**Marco zero (começo da contagem de prazo)** ✔C
- Contrato [C 3.3.1]: **contrato assinado + 1ª parcela paga + topográfico planialtimétrico**.
- Voz [V]: acrescenta os documentos (pessoais, registro, IPTU).
- Aplicação da regra: vale o contrato. Os documentos são **pré-requisito do Projeto Legal** [C 3.3.3], não do marco zero.
  Colocar os documentos no marco zero atrasaria um prazo que o contrato já considera correndo. A inclusão vai para a revisão do contrato (§11).
- **Antes do marco zero não há limite de tempo**, por decisão do Luan: o projeto simplesmente não começa [V]. Sem o topográfico, o prazo não corre [C 3.1].
- Ideia para o contrato: em atraso longo (meses ou um ano), prever a revisão do valor da proposta por inflação. [V] Hoje só a proposta tem validade (30 dias) [P].

**Briefing: captação, briefing e contratação** [V]
- O Luan decidiu que o Briefing é a etapa 01 do projeto e que a mistura com captação e contratação precisa ser corrigida.
- O contrato responde se o briefing vem antes ou depois dele: o projeto segue "as especificações preliminares do
  CONTRATANTE, documentadas através dos **questionários de briefing**" [C 1.2], e a Cláusula 2 começa no EP.
  Portanto, **o briefing acontece antes do contrato e é a base do escopo contratado.** ✔C
- Estrutura (sugestão já registrada): **Captação** (contato → decisão) · **Briefing** (coleta de informações e programa de necessidades) ·
  **Contratação** (contrato, pagamento, topográfico → marco zero).

**Conteúdo do formulário de briefing** [B]: identificação; uso; metragem e espacialidade; terreno; pavimentos; moradores e pets;
acessibilidade; expectativas; programa por setor (social, íntimo, serviço, garagem, lazer); especificidades por ambiente;
itens soltos; prazo e sistema construtivo; estética e materiais; relação com exterior, paisagismo e rua; técnicos (solar,
reúso, ar, aquecimento, automação); forma de execução da obra; investimento e padrão por m² (referência CUB).

---

## 3. Fluxo de projeto

```
Captação ─► Briefing ─► Contratação (marco zero) ─► EP ─► AP (3 fases) ─► PE (2 fases) ─► Encerramento
                                                            └─► PL (paralelo) ──┘
```

**Três termos** [V], com texto a escrever junto com o Luan:
| Termo | Quando | Contrato hoje |
|---|---|---|
| Termo de Encerramento de Etapa | fim do EP e do AP | mesmo nome [C 2.1.7, 2.2.9] |
| Termo de Encerramento de Projeto | fim do PE; encerra o contrato | chama-se "Termo de **Finalização** de Projeto" [C 2.4.8] → novo nome vai para a revisão do contrato (§11) |
| Termo de Ciência de Antecipação (nome provisório) | qualquer pedido do cliente fora do momento previsto; o cliente assume que o retrabalho será cobrado | não existe (§11) |

O Projeto Legal não tem termo da Trilha: fecha com a aprovação.

### Estudo Preliminar (EP)
- Estudos (terreno, insolação, ventilação, chuva, visuais, legislação, demanda) → concepção → decisão interna → 3D (ArchiCAD) →
  render (Lumion) → apresentação. [V]
- Pré-requisito: marco zero. Prazo: até **40 dias úteis** para a 1ª apresentação. [C 3.3.1]
- Desenhos do EP usam o ID **"AP" (Apresentação)**: são desenhos de apresentação e venda, não técnicos. [V]
- **Rodadas de ajuste:** 2 rodadas, cada uma com uma lista única de pedidos e prazo de resposta; a rodada excedente é cobrada. [V]
  - Prazo por rodada: **15 dias úteis** para revisões pontuais. [C 3.3.1]
  - Revisão total: 1 inclusa (30 a 40 dias úteis); a 2ª revisão total custa **20% do contrato**. [C 2.1.5, 9.1]
  - O contrato não limita as revisões pontuais. Cobrar a 3ª rodada exige mudar o contrato (§11).
- Portão: apresentação → aceite → Termo de Encerramento de Etapa. Revisar depois do aceite = aditivo. [C 2.1.7]

**Roteiro da apresentação** [V]: capa → imagem impactante → análise do terreno → estudos esquemáticos de concepção → imagens →
plantas e cortes → imagens → esquemas (estrutura, terraplenagem, ventilação, insolação, visuais) → imagens finais.
O cliente descobre o projeto durante a apresentação; as imagens vão de fora para dentro.

### Anteprojeto (AP): "apertar os parafusos"
Pré-requisito: Termo de Encerramento do EP. [V][C 2.2.1]

| Fase | Conteúdo | Prazo [C 3.3.2] | Saída |
|---|---|---|---|
| **1. Revisão e lançamentos** | Revisão geral (medidas, áreas, cobertura, calhas, tubos de queda, contrapiso, forro detalhado) + **lançamento estrutural** + **lançamento de pontos** (elétrica, hidráulica, rede, climatização, forro e iluminação) | 20 a 30 dias úteis | Primeiras pranchas 100/200/300 ao cliente; arquivos às engenharias |
| **2. Compatibilização** | Ciclos com o calculista e as engenharias (importar, sobrepor, revisar), em geral 2 rodadas por disciplina | 15 dias úteis (estrutural) + 10 dias úteis (demais), contados da entrega de cada complementar | Aceite do Luan → engenharias liberadas para os executivos |
| **3. Definições** | Acabamentos, revestimentos, forro e iluminação finais, louças e metais, bancadas, esquadrias | 15 dias úteis, contados das definições do cliente | Série 400 montada |

- **Onde fica o lançamento (Grupo A, item 3)** ✔C: o contrato põe na fase 1 os ajustes e as especificidades técnicas
  "para que possa ser enviado para desenvolvimento dos Projetos Complementares", e na fase 2 a compatibilização [C 2.2.2].
  A proposta cita o lançamento de estrutura e pontos nessa primeira parte [P]. Vale o contrato: os lançamentos fecham a fase 1.
  Não há conflito com o trabalho real: a ordem continua revisão → lançamentos → envio → compatibilização → definições.
  O que muda é só a fronteira entre as fases. Com isso, a fase 2 passa a ser a que depende dos engenheiros, o que casa com os prazos do contrato.
- Aceites pontuais (WhatsApp, e-mail ou reunião): hoje não registrados; devem passar a ser registrados (ver DECISOES-PROCESSO §Registros). Sem limite de rodadas nem de reuniões. [V]
- Cliente que não define os acabamentos → a Trilha especifica e segue, sem responsabilidade de ajustar depois. [V] ✔C [C 2.2.7]
- Só encerra com o estrutural contratado e desenvolvido [V]; sem o estrutural contratado, o projeto é suspenso [C 2.2.4].
- Compatibilização não é etapa: é a fase 2, inclusa no escopo. [V][C 6.4]
- Portão: reunião final → aceite → Termo de Encerramento de Etapa.

### Projeto Legal (PL), em paralelo
- Desenvolver, protocolar, acompanhar e ajustar até aprovar. Ordem: documentos → condomínio (se houver) → prefeitura. [V][C 2.3]
- **Pré-requisitos contratuais** [C 3.3.3]: documentos do cliente + fim da revisão e dos ajustes do AP + lançamento estrutural pelo engenheiro.
  O que pela voz era "regra desejada" já é **regra do contrato**.
- Exceção: cliente ansioso começa antes, **mediante Termo de Ciência de Antecipação** [V]. Hoje contraria o 3.3.3 e precisa entrar no contrato (§11).
- **Cobrança de alteração:** depois de **protocolado e aprovado**, qualquer alteração de causa externa (cliente, mudança de estrutura, outra intervenção)
  gera adicional; erro ou escolha da Trilha não é cobrado [V]. A cláusula 9.1 só cobre alterações "após aceite e termo de etapa", e o PL não tem termo:
  **o contrato não cobre esse caso** (§11). Antes da aprovação, a leitura é que não se cobra [A CONFIRMAR].
- Prazo: 20 dias úteis para desenvolver e protocolar; depois depende do órgão, sem responsabilidade da Trilha. [C 3.3.3, 2.3.5]
- Taxas e documentos por conta do cliente. [C 2.3.3–2.3.4]

### Projeto Executivo (PE)
- Pré-requisitos, sem exceção: Termo de Encerramento do AP + Projeto Legal aprovado. [V] ✔C [C 2.4.1]
- Etapa interna: sem interferência externa, sem nova compatibilização, sem marco intermediário com o cliente. [V][C 2.4.2]
- Fase 1: séries 100, 200 e 300 evoluídas. Fase 2: séries 400 a 1000. [V]
- Prazo: 40 a 60 dias úteis. [C 3.3.4]
- Alterações: "ajuste fino" interno, sem cobrança; pedido do cliente é aditivo pela cláusula 9. Registrar a **origem** de cada alteração. [V][C 9.1]
- Portão: reunião abrindo as pranchas → aceite → Termo de Finalização de Projeto, que encerra o contrato. [V][C 2.4.8]

### Prazos, espera e suspensão ✔C
- O prazo de cada etapa só conta depois de cumpridos os seus pré-requisitos. [C 3.1]
- Não contam: análise e definições do cliente, complementares, órgãos de aprovação. [C 3.2]
- **Suspensão** [C 3.4]: "interrupção do projeto ou retenção superior a 20 dias úteis pelo CONTRATANTE" → projeto suspenso;
  a Trilha marca a data de reativação **em até 20 dias úteis**. Não distingue etapas, então vale para todas.
  Isso coincide com a regra que o Luan decidiu por voz (20 dias úteis, suspenso, sai das prioridades, retomada depois de alguns dias).
- Não existe cronograma padrão [V]. **Os prazos do contrato já são a base de um cronograma padrão** (EP 40; AP 20–30 + 15 + 10 + 15;
  PL 20; PE 40–60 dias úteis, fora as esperas).
- **Espera por complementares e órgãos: sem trava de limite**, por decisão do Luan; não conta no prazo da Trilha [V][C 3.2].
  Registrar o **prazo informado** pela empresa ou órgão (para saber quando voltar ao projeto) e o **tempo real** da espera. [V]
- A regra dos 20 dias úteis vale só para o cliente. [V]

### Alterações e aditivos [C 9.1]
| Situação | AP | PE |
|---|---|---|
| 2ª revisão total do EP | 20% | — |
| Pequena (fachada, esquadria, layout, acabamento) | 0–2% | 0–5% |
| Maior (ambientes, escadas, programa, sistema estrutural) | 0–10% | 0–20% |
| Grande (inviabiliza o projeto ou reabre etapa) | negociação; pode cobrar a etapa inteira | idem |

---

## 4. Entregáveis

**Hierarquia:** projeto > etapa > fase > **prancha** > **desenho** > item de checklist. [V]
**Prancha ≠ desenho** [V]:
- A prancha tem ID **calculado** por série + posição na lista (mover ou inserir recalcula).
- O desenho tem nome próprio, sem número de prancha: planta baixa, corte AA, fachada 01, `amp01 - cozinha - planta baixa`…
- O número da ampliação (amp) é fixo por ambiente; uma ampliação pode ocupar mais de uma prancha.
- **As séries nunca se repetem:** cada série tem até 99 IDs; mais pavimentos ou unidades só ocupam mais números na mesma série. [V]
- 601, 602 e 603 são sempre criados por padrão e removidos à mão quando não existem. [V]
- **Cobertura:** a planta de cobertura (última da série 100) sempre existe. O 406 é um mapeamento específico (caimentos da laje, ou terças,
  caibros e paginação de telhas), incluído por padrão e removível. [V]
- **Série 400 com vários pavimentos:** cada mapeamento ocupa uma prancha por pavimento, em sequência (3 pavimentos: 402–404 piso,
  405–407 hidro, 408–410 elétrica, 411–413 forro e iluminação) [V]. O mapeamento de cobertura vem **por último**, como no Plano de Projeto
  da proposta ("413 Mapeamento/Detalhamento de Cobertura", depois dos forros) [P]. ✔ resolve a dúvida da posição.
- **Mais de uma edificação** (lodge, pousada): não cria série nova. Ex.: 101 implantação; 102 planta geral; 103 unidade-modelo (ou uma prancha
  por unidade diferente); cobertura depois ou junto de cada unidade. As duas formas valem. [V]

| Série | Conteúdo [V] | Quantidade varia por | Nasce em |
|---|---|---|---|
| 100 | 101 implantação (+ informações gerais e quadro de áreas); plantas por pavimento; última = cobertura | pavimento | AP |
| 200 | Cortes (mín. 4, em 2 pranchas); quadro de esquadrias e legenda de hachuras | corte | AP |
| 300 | Elevações (mín. 4); quadro de esquadrias e legenda de hachuras | fachada | AP |
| 400 | 401 topografia e terraplenagem (planta, cortes, 3D, corte e aterro em m³); piso e acabamento; hidrossanitário; elétrica; forro e iluminação; cobertura | pavimento (piso a forro/iluminação) | AP |
| 500 | Ampliações: cozinha, serviço e lavanderia, cada banheiro, gourmet, escada, piscina | ambiente do programa | PE |
| 600 | 601 alumínio e vidro; 602 madeira; 603 guarda-corpo e corrimão (cadernos A4, 1 esquadria por folha) | folhas | PE |
| 700 | 701 planta de marmoraria; 702 em diante, bancadas | pavimento e área molhada | PE |
| 800 | Detalhamentos construtivos (caderno A3) | livre | PE |
| 900 | 901 mapa de marcenaria; 902 em diante, cada marcenaria. **Só se contratada** | pavimento e peça | PE |
| 1000 | Documentos A4: 1001 terraplenagem; 1002 revestimentos (especificação e quantitativo); 1003 louças e metais; 1004 equipamentos; 1005 tomadas e interruptores; 1006 iluminação | — (rascunho) | PE |

**Sem série:** imagens atualizadas (sem compromisso de quantidade), Guia de Projeto, BIMx (atualizado ao fim do EP, AP e PE). [V]
**EP:** apresentação PDF widescreen, renders avulsos (cerca de 15 numa residência, um único tópico no Plano), plantas cotadas (A3, 1/100), BIMx;
animação como bônus, conforme o tempo e a avaliação da Trilha. [V] O Anexo 01 promete 10 imagens [C]: a prática entrega mais, sem conflito.
**Iluminação:** as pranchas 405 e 1006 continuam como são; o lighting design (serviço novo ou embutido) foi adiado. [V]
**Quantitativos:** entregues para revestimentos, pontos elétricos e iluminação; não há quantitativo total. [V]
O contrato não promete quantitativo; só a proposta fala em "quantitativos gerais" [P]. Vale o contrato: ajustar o texto da proposta (§11). ✔C

**Plano de Projeto na proposta e no Anexo 01 do contrato: versão anterior do padrão** [P][C]
- Numeração antiga: 101 terraplenagem, 102 implantação/cobertura, mapeamentos 401–413 em sequência, sem as séries 700 a 1000.
- O Anexo 01 lista **"10 imagens fotorrealistas" e "01 animação"** no EP. Pela voz, a animação é bônus e as imagens não têm quantidade.
  O Anexo permite que a Trilha altere o Plano [C Anexo 01], mas, enquanto o modelo não for atualizado, o que está listado é o que o cliente leu.
- Quantitativo mínimo EP 24 × 15 itens listados: resolver na atualização do modelo.

---

## 5. Padrões

- EP e PE são **o mesmo modelo BIM evoluindo**; muda a representação (nível de informação, cotas, hachuras). [V]
- Formatos: A1 estendido em 1/50 (séries 100 a 300); cadernos de esquadrias em A4; caderno de detalhes em A3; série 1000 em A4. [V]
- **Revisões:** todo projeto começa em **R00**; revisão considerável → R01, R02… A revisão aparece no nome do arquivo, e cada prancha traz o arquivo de origem e a versão. [V]
- **Nome do arquivo** [X]: `NNN_TR_<PROJETO>_<DISCIPLINA>_<ETAPA> - <TÍTULO>.pdf`. O código do projeto é criado pela Trilha, o padrão será definido depois, e **sem acentos** (decidido). [V]
- Troca com complementares: o contrato fala em .pln/.ifc [C 2.2.8, 7.3]; pela voz também há **exportação DWG** [V]. Não é conflito (vai para a §11).
- Pontos antes listados como "erros", agora esclarecidos:
  - "AP" nos desenhos do EP é **intencional** (Apresentação). Atenção: é a mesma sigla da etapa Anteprojeto. (sugestão: usar "APR" ou outro código para não confundir)
  - Número da ampliação diferente do número da prancha é **intencional** (prancha ≠ desenho).
  - Continua sendo erro: dois arquivos "100" no executivo do print. [V]
- Pendentes: estrutura da pasta padrão (imagem), template ArchiCAD (PDF ou print das abas), checklists por desenho, checklist da visita, biblioteca de padrões técnicos. [V]

---

## 6. Complementares e aprovações

- Contratados e pagos pelo cliente; prazos definidos pelas empresas; a Trilha indica, participa e **gerencia**, incluso no escopo. [V][C 2.2.3, 6.4]
- Estrutural e fundações **obrigatórios** (sem eles o projeto é suspenso); os demais são recomendados. [C 2.2.4–2.2.5]
- Padrão: estrutural, hidrossanitário, elétrico (iluminação de apoio, rede, automação), SPDA, climatização. Raros: paisagismo, luminotécnico. [V]
- **Só o Luan** fala com os complementares; a Elisa não participa da compatibilização. [V]
- **Estrutural, sempre primeiro:** a Trilha lança pilares, vigas e laje → reunião → envio → lançamento preliminar do calculista → reunião →
  ok da Trilha → o calculista envia → a Trilha importa e sobrepõe → ajustes até fechar. [V]
- **Demais disciplinas:** reunião inicial → a disciplina lança e envia → a Trilha importa, sobrepõe e revisa → ida e volta. Em geral 2 rodadas. [V]
- Interferências: anotadas em papel e perdidas; o Luan testa um fluxo com o Claude que gera um PDF para engenharias e cliente. [V]
- Atraso de engenheiro: sem consequência formal, só cobrança; o engenheiro avisa a data de retorno. [V]
- Aprovações: condomínio → prefeitura. [V]

---

## 7. Variações por tipo (detalhamento adiado)

| Modelo | Exemplos | Etapas |
|---|---|---|
| Do zero | residência, restaurante, pousada, chalé, institucional | EP → AP → PL (paralelo) → PE |
| Reforma | apartamento, residência, restaurante | EP → PE; PL e complementares só se necessário |
| Interiores e marcenaria | — | EP → PE |

- Mesma lógica de etapas, entregáveis, IDs e termos; muda a lista de entregáveis (a detalhar). [V]
- O Luan já tem estrutura para reforma e interiores e vai passá-la depois. [V]

---

## 8. Gestão do dia a dia e dores [V]

- **Dor principal:** duas pessoas, entrega de altíssima qualidade, margem apertada, sobrecarga no Luan.
- O processo tinha estrutura, mas não estava documentado; falta um painel com registros e caminho claro.
- **Volbi** não funcionou: complexo demais, muitos cliques e páginas. Critério para qualquer ferramenta: **poucos cliques**.
- Tempo perdido pesquisando padrões técnicos (ex.: altura de ponto elétrico); esquecimentos por não haver registro.
- Retrabalho: apresentações e reuniões de ajuste.
- **Quem mais atrasa é o cliente.** Perfis: direto, avulso, indeciso.
- Reuniões consomem muito tempo e não são medidas. O Luan quer registrá-las com o tempo gasto somado ao projeto.
- Revisão interna antes de entregas e antes de encerrar etapas; revisão final do Luan (depois, da Elisa). Não é registrada e deveria ser.
- Atendimento em horário comercial, das 8h às 18h, de segunda a sexta. [C 7.11]
- Ideia: **guia do cliente**, para explicar o processo e reduzir a ansiedade; é diferente do Guia de Projeto (nome a definir).

---

## 9. Encerramento e passagem para obra

- Termo de Finalização de Projeto; entrega por e-mail [V][C 2.4.8]. Entrega física em implantação [V]; o contrato já prevê, com custo do cliente (impressão, box, placa de obra, envio) [C 2.4.5].
- **Guia de Projeto** (PDF A4): capa; informações gerais; lista-guia das pranchas; documentos da série 1000; plantas, cortes e elevações no padrão do EP; perspectivas esquemáticas; imagens atualizadas. [V]
- Obra [C]:
  - o cliente só inicia a obra depois da finalização total do projeto (5.7);
  - alterações em obra dependem de autorização da Trilha (7.5, 7.8);
  - a Trilha não emite RRT de execução;
  - placa de autoria e ensaio fotográfico autorizados (8.7–8.8).
- **Fiscalização e administração de obra: contratos à parte**, fora do processo de projeto (gestão de obra é outro serviço).
  O processo de projeto termina no Termo de Encerramento de Projeto. [V] A proposta já os apresenta como serviços separados (administração: 12% do custo global) [P];
  o contrato de projeto recomenda contratar a obra por administração [C 7.7]. (sugestão: prever um ponto de ligação entre os dois módulos)
- Prática: indicar executores e fazer reuniões para explicar o projeto. [V]

---

## 10. Referência externa

ABNT NBR 16636 (partes 1 e 2): sequência próxima à da Trilha (levantamento, programa de necessidades, estudo de viabilidade,
estudo preliminar, anteprojeto, projeto legal, projeto básico opcional, projeto executivo). [A CONFIRMAR: conferir o texto vigente]

---

## 11. Pontos a ajustar no contrato (lista pedida pelo Luan)

Numeração igual à §5 do levantamento por voz v3. A coluna "Contrato hoje" foi conferida no texto do contrato e da proposta.
Enquanto não houver revisão, **vale o contrato**. Esta lista vai para a revisão do contrato em outro chat.

| # | Tema | Contrato hoje | Decisão da Trilha | Ação |
|---|---|---|---|---|
| 1 | Marco zero | contrato assinado + 1ª parcela + topográfico (3.3.1); documentos só como pré-requisito do PL (3.3.3) | contrato + documentos + topográfico + pagamento; sem limite antes dele | incluir documentos; avaliar cláusula de revisão do valor se o atraso antes do marco zero for longo |
| 2 | Rodadas do EP | até 1 revisão total inclusa (2.1.5); revisões pontuais em 15 dias úteis, **sem limite** (3.3.1); 2ª revisão total = 20% (9.1) | 2 rodadas, lista única de pedidos, prazo de resposta; excedente cobrada | incluir o limite de 2 rodadas pontuais e o valor da excedente |
| 3 | Antecipação | não existe; PL só depois do lançamento estrutural (3.3.3) | Termo de Ciência de Antecipação para qualquer pedido fora do momento previsto; retrabalho cobrado | criar a cláusula e o termo |
| 4 | Alteração no PL aprovado | 9.1 cobra alterações "após ACEITE e assinatura do termo"; o PL não tem termo → **não coberto** | alteração de causa externa depois de protocolado e aprovado = adicional | criar o critério de origem para o PL |
| 5 | Nomes dos termos | "Termo de Encerramento de Etapa" (2.1.7, 2.2.9); "Termo de **Finalização** de Projeto" (2.4.8); na 9.1 aparece "termo de finalização de etapas" | encerramento de etapa; encerramento de projeto | uniformizar os nomes |
| 6 | Quantitativos | o contrato não promete; a **proposta** diz "listagens com quantitativos gerais" (PE) | só revestimentos, pontos elétricos e iluminação | ajustar o texto da proposta |
| 7 | Suspensão | retenção pelo cliente > 20 dias úteis → suspenso; reativação em até 20 dias úteis (3.4); vale para todas as etapas | igual | ✔ já coberto; nada a mudar |
| 8 | Alteração no executivo | nenhuma alteração do cliente; se houver, aditivo (2.4.2, 9.1: 0–5% pequena, 0–20% maior) | ajuste fino interno sem cobrança; demanda do cliente cobrada | ✔ coberto; opcional: explicitar o "ajuste fino interno" |
| 9 | Lançamentos no AP | fase 1 = revisão e ajustes técnicos para enviar aos complementares; fase 2 = compatibilização (2.2.2) | igual ao contrato | ✔ coberto |
| 10 | Numeração repetida | 2.3.3 e 2.4.5 aparecem duas vezes | — | corrigir |
| 11 | Pranchas e DWG | Anexo 01 com numeração antiga; troca só em .pln/.ifc (2.2.8, 7.3, 7.4) | séries 100 a 1000; também DWG | atualizar o Anexo 01 e os formatos |
| 12 | Papel da Elisa | proposta: diretora de projetos e responsável técnica | igual | ✔ coerente |
| 13 | Obra | não emite RRT de execução; recomenda contratar por administração (7.7); proposta separa administração e fiscalização | contratos à parte | ✔ coerente; opcional: citar o contrato de obra |
| 14 | Espera por terceiros | tempos de cliente, complementares e órgãos fora do prazo (3.2); sem responsabilidade pelo prazo do órgão (2.3.5) | sem limite; só medir | ✔ coberto |
| 15 | Anexo 01 (Plano de Projeto) | numeração antiga; EP com "10 imagens" e "01 animação"; quantitativo EP 24 com 15 itens; a Trilha pode alterar o Plano | séries 100 a 1000; cerca de 15 imagens; animação como bônus | atualizar o modelo do Anexo |

---

# Termos do projeto — textos (rascunho para revisão do Luan)

Base: contrato padrão da Trilha (cláusulas 2.1.7, 2.2.1, 2.2.9, 2.4.1, 2.4.2, 2.4.8 e 9.1).
Os campos entre chaves `{…}` são preenchidos pelo app com os dados do Cadastro e do projeto.

## Como o termo é usado

- Gerado no **fim da etapa** (não é item de checklist), em PDF com a identidade da Trilha, para enviar e assinar.
- Encerramento de Etapa e Termo de Ciência têm um quadro de **anotações** opcional (pontos para a próxima etapa;
  não reabrem a etapa). Encerramento de Projeto não tem anotações.
- No Termo de Ciência é obrigatório dizer **o que será antecipado**.
- Precisa do nº e da data do contrato e do nome e CPF/CNPJ de cada cliente.
- Gerar e assinar o termo fica registrado no histórico do projeto.

## Cabeçalho comum (os 3 termos)

- Logo e nome: Trilha Arquitetura Brasileira
- Título do termo
- Contrato de Prestação de Serviço nº {contrato_numero}, de {contrato_data}
- CONTRATANTE: {clientes — nome e CPF/CNPJ de cada um}
- Projeto: {projeto_nome} ({projeto_codigo}) · {endereco}
- Etapa: {etapa} · início {data_inicio} · entrega {data_entrega}

## Rodapé comum

{cidade}, {data_por_extenso}

Assinatura de cada CONTRATANTE · Assinatura da Trilha Arquitetura Brasileira (CONTRATADO)

---

## 1. Termo de Encerramento de Etapa (Estudo Preliminar e Anteprojeto)

> Pelo presente termo, o(s) CONTRATANTE(s) acima identificado(s) declara(m) que recebeu(ram) o **{etapa}** do
> projeto **{projeto_nome}**, desenvolvido pela Trilha Arquitetura Brasileira conforme o contrato acima.
>
> Declara(m) que todo o conteúdo previsto para esta etapa foi apresentado, ajustado e entregue, e dá(ão) seu
> **ACEITE**, encerrando a etapa e autorizando o início do **{proxima_etapa}**, conforme a cláusula {clausula} do
> contrato.
>
> Declara(m) estar ciente(s) de que qualquer revisão desta etapa, depois de encerrada, será tratada como adicional
> de contrato, conforme a cláusula 9.1.

**Anotações para a próxima etapa** (quadro; se vazio, sai "Sem anotações")

> As anotações abaixo não reabrem a etapa encerrada. São pontos combinados para serem considerados no
> desenvolvimento da próxima etapa.
>
> {anotacoes}

Cláusulas: EP → 2.1.7 · AP → 2.2.9.

## 2. Termo de Encerramento de Projeto (Projeto Executivo)

> Pelo presente termo, o(s) CONTRATANTE(s) acima identificado(s) declara(m) que recebeu(ram) o **Projeto Executivo**
> completo do projeto **{projeto_nome}**, entregue em meio digital pela Trilha Arquitetura Brasileira em
> {data_entrega}, conforme a cláusula 2.4.8 do contrato.
>
> Declara(m) que todo o conteúdo previsto no contrato e no Plano de Projeto foi entregue, e dá(ão) seu **ACEITE**,
> encerrando o projeto e os serviços contratados.
>
> Declara(m) estar ciente(s) de que alterações no projeto a partir deste momento serão tratadas como novo serviço
> ou adicional de contrato, conforme as cláusulas 2.4.2 e 9.1, e de que a disponibilização do material aos
> executores e o seu uso em obra são de sua responsabilidade (cláusulas 2.4.5 a 2.4.7).

Sem quadro de anotações.

Marcenaria (aprovado): o termo final da arquitetura cita "projeto arquitetônico", para não encerrar
a marcenaria contratada à parte. A marcenaria usa os mesmos modelos: Encerramento de Etapa (EP Marcenaria) e
Encerramento de Projeto (Executivo Marcenaria), com o nº do contrato da marcenaria.

Nome: o contrato atual chama este termo de "Termo de **Finalização** de Projeto" (2.4.8). O novo nome já está na
lista de ajustes do contrato (MAPEAMENTO §11). Até a revisão, o PDF pode citar os dois: "Termo de Encerramento de
Projeto (Termo de Finalização de Projeto, cláusula 2.4.8)".

## 3. Termo de Ciência de Antecipação

> Pelo presente termo, o(s) CONTRATANTE(s) acima identificado(s) solicita(m) que **{o_que_antecipar}** seja
> iniciado antes do momento previsto no contrato, que tem como pré-requisito **{pre_requisito}**.
>
> Declara(m) estar ciente(s) de que:
> - a antecipação é feita a seu pedido;
> - informações ainda não definidas podem mudar e exigir que partes do projeto sejam refeitas;
> - o retrabalho causado pela antecipação será cobrado como adicional de contrato, conforme a cláusula 9.1;
> - os prazos das etapas seguintes podem ser afetados.

**Anotações** (quadro; se vazio, sai "Sem anotações")

> {anotacoes}

Observação: o contrato atual ainda não prevê a antecipação (conflita com o 3.3.3). Está na lista de ajustes do
contrato (MAPEAMENTO §11, item 3).

---

# Formato dos documentos de processo (PDF)

Os três documentos de 28/09/2026 estão em `../documentos/` (PDF pronto) e `../documentos/fonte/` (fonte HTML).

| Documento | Público | Conteúdo | Fonte |
|---|---|---|---|
| Mapeamento do Processo de Projeto (v1) | Luan (sócios) | processo completo com administrativo, contrato, dinheiro, dores, falhas, sugestões, pendências e pauta de revisão do contrato | `mapeamento.html` |
| Manual do Processo de Projeto (v1) | equipe (arquitetos, colaboradores, estagiários) | formal e direto; sem administrativo nem contrato; só como as coisas acontecem, etapa por etapa, com regras e passos | `manual.html` |
| O caminho do seu projeto | cliente | guia visual das etapas ligadas por setas, prazos e o que faz o projeto fluir; reduzir a ansiedade. Não confundir com o Guia de Projeto (entregável do Executivo) | `caminho.html` |

Observação: a v1 do Mapeamento cita em alguns pontos o app de gestão; nas próximas versões, tirar essas partes
(o app tem chat e regras próprios) e incorporar `DECISOES-PROCESSO.md`.

## Identidade visual

- A4, margens 18 / 17 / 20 / 17 mm; rodapé com o nome do documento à esquerda e "página / total" à direita.
- Fontes: **Comfortaa** (títulos, rótulos, números) e **Work Sans** (texto), locais em `fonte/fonts/` (`local.css`).
- Cores: verde-sálvia **#88AC67** (destaque), verde escuro #5f8443, neutros levemente esverdeados (oklch, matiz 145);
  vermelho #b3593f (falha), âmbar #a57a22 (falta), azul #4f7390 (informação).
- Capa: logo (52 mm) no alto, faixa com linha verde de 3 px, título 30 pt, subtítulo, e no pé os metadados
  (público, versão, data, modelo descrito).
- Sumário em duas colunas; cada capítulo começa em página nova; título de capítulo com número em verde.
- Componentes (em `trilha-doc.css`): `lead` (parágrafo de abertura com fio verde), tabelas com cabeçalho verde-claro,
  caixas `box` (`falha`, `sug`, `falta`, `info`), etiquetas `tag`, gravidade `sev` (alta/média/baixa), cartões,
  grades de 2 e 3 colunas, `flow` (etapas ligadas por setas, com etapa paralela tracejada) e `rule` (regra em destaque,
  no Manual), passos numerados.
- Fontes das informações marcadas em cinza pequeno: [V] voz do Luan, [C] contrato, [P] proposta, [B] briefing,
  [X] print de exportação.
- Texto em português do Brasil, frases curtas, linguagem de arquiteto (não de programador).

## Como gerar o PDF

1. Editar o HTML em `fonte/` (mesma pasta de `trilha-doc.css`, `logo.png` e `fonts/`).
2. Atualizar versão e data na capa e no rótulo do rodapé em `render.js`.
3. Rodar com Playwright: `PW=$(npm root -g)/playwright node render.js` (gera os três PDFs na pasta).
4. Conferir as páginas como imagem (ex.: `pdftoppm -r 60 -png`) antes de entregar: quebras de página, tabelas
   cortadas, capa.
