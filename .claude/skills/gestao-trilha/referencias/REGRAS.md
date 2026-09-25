# Gestão Trilha — regras dos módulos Tempo, Tarefas, Projetos, Financeiro, Relatórios e Configurações

Artefato: https://claude.ai/artifact/N5fGJZBumZy7dyN57w7e8o
Código-fonte: pasta `gestao-trilha/` (estrutura em módulos — ver `CONTRATO.md`).
Capacidades declaradas: `db` (banco de dados do artefato), `downloads` (exportar CSV) e `mcp` com o conector
"Google Calendar" (só `create_event` e `update_event`, mesma integração do antigo gestor de tarefas).

Para continuar em outra conversa: anexe `CONTRATO.md` e este arquivo (ou dê acesso ao repositório) e peça para
republicar no **mesmo** artefato passando a URL acima como `url` (assim os dados são mantidos).

## Objetivo

Mapear tempo e custo de cada projeto para precificar com base em dados, não em estimativa.
É a base do futuro controle financeiro do escritório.

## Navegação (v3)

- **Capa (página inicial):** só botões. Botões das pessoas (Luan, Elisa) com horas do mês, tarefas a fazer e
  atrasadas, e um botão por app do escritório (Financeiro, Projetos, Relatórios, Configurações e os "Em breve"),
  com descrição fixa. Nenhum app do escritório mostra dados ou avisos na capa; cada um tem a própria página inicial.
- **Área da pessoa:** abas **Tempo** e **Tarefas**, mais "← Início". Cabeçalho padrão com o nome da pessoa.
- **Apps do escritório** (Financeiro, Projetos, Relatórios, Configurações): cada um abre como um app próprio, com o
  título e só o botão "← Início" no topo; para ir a outro app, volta-se à capa.
- O app sempre abre na capa.

## Regras de negócio

1. **Um único app para todos.** Cada pessoa lança as próprias horas; os relatórios consolidam tudo.
2. **Pessoas:** hoje Luan e Elisa, os dois como sócios, usando a mesma conta Claude. A pessoa é escolhida
   em "Lançando como" (lembrado no navegador). Cada lançamento guarda `pessoaId`.
3. **Cada hora tem 3 campos:** Onde (projeto ou área interna) → Etapa (só para projeto) → O que foi feito
   (texto livre curto, com sugestões do que já foi digitado).
4. **Etapas de projeto (da Trilha, não do CAU):** Estudo Preliminar, Anteprojeto, Projeto Legal,
   Compatibilização, Projeto Executivo, Obra. Editáveis em Configurações.
5. **Áreas internas (não faturáveis):** Administrativo, Marketing, Comercial e captação, Capacitação. Editáveis.
6. **Tipos de projeto:** Residencial, Comercial, Interiores, Reforma, Outro. Editáveis.
3a. **Tipo de trabalho no cronômetro:** botões Projeto | Gestão | Obra. Projeto → projeto + etapa
   (a lista de etapas não mostra "Obra"); Gestão → área interna; Obra → projeto + **tópico de obra**
   (Orçamento preliminar, Orçamento executivo, Planejamento de obra, Cronograma de obra, Controle financeiro,
   Controle de gestão, Execução de obra — editáveis em Configurações). No banco: gestão = `tipo: "area"`,
   obra = `tipo: "projeto"` com `etapaId: "obra"` e `topicoId`. Relatórios têm a tabela "Obra" por tópico.
3b. **Proteções do cronômetro:** cada navegador tem um id e um nome ("Windows · Chrome"). O cronômetro guarda
   onde foi iniciado; pausar/concluir de outro aparelho pede confirmação. Cada lançamento do cronômetro guarda
   `motivo` (pausar/concluir/trocar) e `paradoEm` (aparelho e horário), visível como etiqueta. Depois de pausar ou
   concluir aparece "Desfazer" por 10 s (apaga o lançamento e o cronômetro volta a correr do horário original).
   Os botões perdem o foco após o clique, para um Enter/espaço posterior não pausar sem querer.
3c. **Configurações:** todo Salvar mostra "Salvando…" → "Salvo ✓" (ou o erro) ao lado do botão; listas editadas
   mostram "Alterações não salvas" até salvar.
7. **Cronômetro é a forma principal.** Um cronômetro por pessoa, salvo no banco (sobrevive a recarregar a
   página e aparece para os outros como "está em…"). Iniciar outra atividade com o cronômetro ligado para
   a atual e começa a nova. Menos de 1 minuto não é salvo.
8. **Atividades (pausar × concluir):** cada combinação onde + etapa + descrição é uma atividade. O cronômetro
   tem **Pausar** (salva o tempo; a atividade vai para "Continuar de onde parou") e **Concluir** (salva o tempo;
   a atividade vai para a lista "Concluídas" no fim da página, com opção **Reabrir**). Iniciar outra atividade
   com o cronômetro ligado pausa a atual. Uma atividade pausada pode ser concluída sem retomar (botão ✓).
   Concluídas somem da lista após 60 dias (as horas continuam nos lançamentos).
8a. **Quadros do mês (Tempo):** horas no mês (com média por dia trabalhado), atividades em andamento e
   atividades concluídas no mês. Mês = do dia 1º ao último dia (vale também para os relatórios).
8b. **Tarefas (agenda de alto nível, independente do tempo):** mesmas regras do antigo gestor de tarefas —
   grupos Compromisso (topo), A fazer (Prioridade → Demanda → Tarefa) e Concluídas; marcar conclui e move;
   "Limpar concluídas" com confirmação; Prioridade com título vermelho; Prazo/Data editável no card e em
   vermelho "· atrasado"; criada em / concluída em / quanto levou; checklist. Compromisso tem Data, Horário,
   Duração, Lembrete e Repetir (só na criação) e é enviado à Agenda Google (calendário
   trilha@trilhaarq.com.br) com o nome da pessoa no título. Excluir a tarefa não apaga o evento da agenda.
8c. **Fechamento mensal automático:** no primeiro acesso de cada mês o app grava em `fechamentos` o resumo do
   mês anterior de cada pessoa (horas, dias, média por dia, valor-hora, valor a pagar) e mostra um aviso no
   topo de Relatórios até alguém clicar em "Conferido". Se houver ajustes depois, Relatórios avisa e permite atualizar.
9. **Lançamento manual:** data, início, fim, onde, etapa, descrição. Fim menor que início = passou da meia-noite.
   Limite de 16 h por lançamento.
10. **Semana fechada:** a semana vai de segunda a domingo. Incluir, editar ou excluir lançamento de semana
    anterior exige justificativa (mínimo 5 caracteres), registrada em `ajustes` com data, pessoa, ação e
    valores anteriores. Exclusão em semana fechada é lógica (`excluido: true`); na semana atual é definitiva.
11. **Custos:**
    - custo-hora da pessoa (opcional) = quanto a hora custa ao escritório;
    - rateio = custos fixos mensais ÷ (horas produtivas por pessoa × nº de pessoas ativas); padrão 112 h;
    - custo-hora total = custo-hora da pessoa + rateio;
    - custo do lançamento = horas × custo-hora total. Desde a v4 cada lançamento novo grava o `custoHora`
      vigente (congelado); lançamentos antigos, sem o campo, usam o valor atual.
    Sem custo-hora preenchido, o app mostra "—" e pede o dado, nunca zero.
12. **Projetos:** nome, cliente, tipo, área (m²), honorário, situação (ativo/pausado/concluído), horas
    previstas por etapa (opcional) e **perfil do projeto** (base da precificação por horas): padrão de acabamento,
    pavimentos, ambientes complexos (cozinhas, banheiros, gourmet), terreno/existente simples ou complexo,
    escopo contratado (etapas), complementos (marcenaria, interiores, luminotécnico, paisagismo, aprovação,
    acompanhamento de obra), exigência do cliente e nº de revisões (preenchidos no fim). O card mostra o resumo. Card mostra horas, custo, horas/m², custo/m², margem e barras de
    previsto × realizado (âmbar a partir de 80%, vermelho acima de 100%).
13. **Relatórios** (filtro por período e pessoa): resumo, por pessoa (horas, dias, média/dia, % em projetos,
    valor a pagar), por projeto, por etapa, áreas internas, por atividade (15 mais frequentes) e
    fechamento mensal por pessoa (entrada, saída e horas por dia, total e valor a pagar = horas ×
    valor-hora de pagamento). Exportação em CSV (separador `;`, compatível com Excel em português).
14. **Identidade visual:** a mesma do gestor de tarefas — verde-sálvia #88AC67, neutros oklch levemente
    esverdeados, Comfortaa em títulos e rótulos, Work Sans no texto, cards com borda de 1px e raio de 10px,
    pills, logo preta no canto superior direito invertida no tema escuro.

## Financeiro (v1 — em uso desde setembro de 2026)

Objetivo: controle simples do dinheiro do escritório, mesmo sem CNPJ e com conta misturada ("caixa do escritório"):
tudo que os clientes pagam é receita do escritório; tudo que é gasto do trabalho é despesa; gasto pessoal não entra.

1. **Páginas:** Painel (início), Receitas, Despesas, Contratos, Ajustes, com seletor de mês e botão "+ Lançar" sempre visível.
2. **Painel:** um **quadro de resumo do mês** (borda verde) lido como conta: Entrou − Saiu (despesas pagas + equipe)
   = Resultado do mês, com o **Resultado no ano** (jan até o mês) em destaque à direita e a variação das entradas
   sobre o mês anterior no cabeçalho; gráfico de 12 meses (entrou × saiu, verde e azul); quadro **Próximos 90 dias**
   com A receber, A pagar (com a equipe), Saldo previsto (a receber − a pagar) e Reserva guardada (com o imposto a
   separar no ano); lista **A receber** (atrasadas + mês; filtro "Todas em
   aberto") com "Recebido ✓", "Recebidas no mês" recolhível e **A pagar** recolhível ("x de y resolvidas · faltam R$").
   Na cópia de teste, uma faixa no topo do Financeiro avisa que os dados são fictícios.
3. **Receber/pagar em dois cliques:** "Recebido ✓"/"Pago ✓" abre data (hoje), valor, forma e conta já preenchidos →
   Confirmar. Toast com "Desfazer". Parcela recebida mostra "Recibo" e "Desfazer". Nada do Financeiro aparece na capa.
4. **Equipe = todos que trabalham** (sócios ou colaboradores, Luan incluído): remuneração = horas do mês × valor-hora
   (fechamento mensal do Relatórios). No painel entra por competência (horas do mês; mês em andamento calculado ao vivo).
   Cada fechamento gravado vira "Remuneração · Pessoa" a pagar no dia configurado do mês seguinte (padrão 5);
   o pagamento não soma de novo em "Saiu". O que sobra depois da equipe é o resultado (lucro) do escritório.
5. **Contratos:** projeto (ou "+ Novo projeto", criado em Projetos), cliente, CPF/CNPJ (opcional, sai no recibo),
   serviço, valor total, situação (ativo/encerrado) e parcelas: gerar N parcelas mensais/quinzenais a partir do 1º
   vencimento (última absorve o arredondamento) e editar descrição (etapa), vencimento e valor de cada uma.
   "Já recebida" marca parcelas pagas antes do app (`anterior: true`). Soma diferente do total aparece em vermelho.
   Se o projeto não tem honorário, o valor total do contrato é gravado nele.
6. **Despesas fixas (recorrentes):** descrição, categoria, valor cheio, % do escritório (gastos divididos com a casa),
   mensal ou anual (mês), dia, início. Aparecem sozinhas como "a pagar" em cada mês (não gravam nada até pagar);
   "Não houve" registra que não ocorreu no mês; "Encerrar" para de repetir. "Mapear despesas" = checklist de gastos
   típicos de escritório de arquitetura com valor e %. Custo fixo mapeado = mensais + anuais ÷ 12, com botão para
   levá-lo a Configurações (rateio do custo-hora).
7. **Lançamento avulso:** Entrada, Saída ou Guardar na reserva; valor, data, descrição, categoria, projeto, "recebido de"
   (entrada), situação (já pago/previsto), forma, conta, "repete todo mês" (saída → cria despesa fixa).
8. **Categorias** (editáveis em Ajustes): entradas (honorários, acompanhamento de obra, consultoria, reembolso, outras)
   e saídas (softwares, espaço de trabalho, telefone, plotagem, deslocamento, terceiros, taxas CAU/RRT, marketing,
   equipamentos, capacitação, impostos, outras). Fixas: Remuneração da equipe (grupo equipe), Retirada de lucro
   (grupo lucro), Guardado na reserva / Resgate da reserva (grupo reserva) — esses grupos não contam como despesa
   nem receita. Contas padrão: Conta Luan e Dinheiro em espécie. Formas: Pix, Dinheiro, Transferência, Boleto, Cartão.
9. **Recibo:** numerado (0001…), gerado ao confirmar (opção "Gerar recibo") ou depois pelo botão "Recibo"; mostra a
   prévia com a logo e baixa PDF A4 (jsPDF 2.5.1 do cdnjs + capacidade `downloads`). Texto: recebi de, CPF/CNPJ,
   valor e valor por extenso, referente a (parcela n de N, etapa, serviço e projeto), forma, data, cidade e data por
   extenso, assinatura (nome e CPF de Ajustes) e rodapé com contato. O número fica gravado no item.
10. **Ajustes:** pessoas e valor-hora (edição em Configurações), dados do recibo, próximo número, dia de pagar a
    equipe, conta e forma padrão, % de reserva de imposto (opcional), contas e categorias.
11. **Cálculos:** caixa para entradas e despesas (data do pagamento); listas de abertos pela data de vencimento;
    atrasado = aberto com vencimento antes de hoje.
12. **Mês de início** (`fin_config/geral.inicio`, oficial = 2026-09): meses anteriores ficam zerados no painel e no
    gráfico, e remunerações de fechamentos anteriores não aparecem a pagar (evita prejuízo fictício de meses sem
    registro). Se o documento não existir, vale o mês atual e ele é gravado na primeira configuração salva.
13. **Receitas e Despesas** abrem com um quadro de resumo único (mesmo estilo do Painel): Receitas = recebido no
    mês, ainda a receber no mês, atrasado, recebido no ano; Despesas = despesas pagas, equipe no mês, ainda a pagar,
    custo fixo mapeado.

### Modelo de dados do Financeiro

- `fin_config/geral`: `inicio` (AAAA-MM), `contas[]`, `categorias[{id,nome,tipo,grupo?,fixa?}]`, `impostoPct`, `diaPagamentoEquipe`,
  `contaPadrao`, `formaPadrao`, `recibo{nome,doc,cidade,contato}`, `proximoRecibo`, `teste` (só na cópia de teste).
- `fin_contratos/{id}`: `projetoId`, `cliente`, `clienteDoc`, `servico`, `valorTotal`, `status` ("ativo" | "encerrado"),
  `criadoEm`, `parcelas[]` com `id`, `descricao`, `vencimento`, `valor`, `recebidoEm`, `valorRecebido`, `forma`,
  `conta`, `anterior`, `recibo{n,emitidoEm}`.
- `fin_mov/{AAAA-MM}` (mês do vencimento): `itens[]` com `id`, `tipo` ("entrada" | "saida"), `categoriaId`, `valor`,
  `descricao`, `projetoId`, `cliente`, `vencimento`, `status` ("prevista" | "paga" | "pulada"), `pagoEm`, `forma`,
  `conta`, `origem` ("manual" | "recorrente" | "fechamento"), `recId` + `refMes` (despesa fixa), `fechId` + `refMes`
  (remuneração), `recibo`, `criadoEm`.
- `fin_recorrentes/lista`: `itens[]` com `id`, `descricao`, `categoriaId`, `valor`, `pct`, `freq` ("mensal" | "anual"),
  `mesAnual`, `dia`, `inicio`, `fim` (AAAA-MM).

### Próximas versões do Financeiro

- Rentabilidade por projeto (contrato recebido × horas × custo-hora × despesas do projeto).
- Calculadora de proposta (perfil do projeto → horas parecidas → preço), previsto × realizado.
- Termômetro de formalização (autônomo × Simples Nacional, validar com contador).

## Modelo de dados

- `pessoas/{id}`: `nome`, `perfil` ("socio" | "colaborador"), `custoHora`, `valorHora`, `ativo`, `ordem`.
- `config/escritorio`: `etapas[{id,nome}]`, `areas[{id,nome}]`, `obraTopicos[{id,nome}]`, `tipos[{id,nome}]`,
  `custosFixosMensais`, `horasProdutivasMes`.
- `projetos/{id}`: `nome`, `cliente`, `tipo`, `area`, `honorario`, `status`, `horasPrevistas{etapaId: h}`, `criadoEm`.
- `timers/{pessoaId}`: `pessoaId`, `atividadeId`, `tipo`, `alvoId`, `etapaId`, `topicoId`, `descricao`, `inicio`, `dispositivo{id,nome}`.
- `atividades/{pessoaId}`: `itens[]` com `id`, `tipo`, `alvoId`, `etapaId`, `descricao`, `status`
  ("andamento" | "pausada" | "concluida"), `criadoEm`, `ultimoUso`, `concluidoEm`.
- `tarefas/{pessoaId}`: `itens[]` com os campos do antigo gestor (`title`, `description`, `subdivision`,
  `status`, `checklist`, `dueDate`, `dueTime`, `durationMinutes`, `reminderMinutes`, `recurrence`,
  `calendarEventId`, `calendarId`, `createdAt`, `completedAt`) + `id`. Para registrar uma tarefa pelo chat,
  ler o documento, acrescentar o item e gravar com `if_version`.
- `fechamentos/{pessoaId}_{AAAA-MM}`: `min`, `dias`, `mediaMin`, `valorHora`, `valor`, `geradoEm`,
  `conferido`, `conferidoEm`.
- `lancamentos/{pessoaId}_{AAAA-MM}`: `pessoaId`, `mes`, `itens[]` — **um documento por pessoa por mês**
  (o banco do artefato tem limite de 5.000 documentos; assim são ~12 por pessoa por ano). Cada item:
  `id`, `pessoaId`, `tipo` ("projeto" | "area"), `alvoId`, `etapaId`, `descricao`, `inicio`, `fim` (ISO),
  `min`, `atividadeId`, `topicoId`, `motivo`, `paradoEm{id,nome,em}`, `origem` ("cronometro" | "manual"), `criadoEm`, `editadoEm`, `excluido`, `ajustes[]`.

## Próximos passos previstos

- Acesso por perfil quando houver funcionários: conta Claude separada para a equipe, artefato
  compartilhado com "Pode interagir" e regras de acesso no banco (cada colaborador vê só as próprias
  horas; custos e relatórios só para sócios). Os lançamentos já guardam `pessoaId` para isso.
- Integração com o sistema de orçamento de obra (honorários e etapas).
- Base de precificação: média de horas por etapa e por m², por tipo de projeto.
