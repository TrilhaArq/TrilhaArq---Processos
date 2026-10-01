# Gestão Trilha — regras dos módulos Tempo, Tarefas, Gestor de Projetos, Cadastros, Financeiro, Relatórios e Configurações

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

- **Capa (página inicial):** botões das pessoas (Luan, Elisa…) com horas do mês, tarefas a fazer e atrasadas, um
  botão por app do escritório com descrição fixa — na ordem (esquerda → direita, de cima para baixo): Gestor de
  Projetos, Gestor de obras (em breve), Gestor Comercial (em breve), Financeiro, Relatórios, Configurações e
  Cadastros (decisão do Luan em 29/09/2026) — e, acima deles, as **notificações** do Gestor de Projetos
  (decisão do Luan em 29/09/2026: o app fica aberto numa segunda tela e as notificações chamam a atenção).
- **Área da pessoa:** abas **Tempo**, **Tarefas** e **Projetos** (Meu trabalho), mais "← Início"; as notificações
  da pessoa aparecem acima das abas.
- **Horas e custos** deixou de ser botão da capa (29/09/2026): é a aba "Horas e custos por projeto" dentro de
  Relatórios. "+ Novo projeto" ali abre o assistente do Gestor de Projetos.
- **Apps do escritório** (Gestor de Projetos, Cadastros, Financeiro, Relatórios, Configurações):
  cada um abre como um app próprio, com o título e só o botão "← Início" no topo; para ir a outro app, volta-se à capa.
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

## Gestor de Projetos, Cadastros e Meu trabalho (oficial desde 29/09/2026)

Base: mapeamento do processo da Trilha (`manual-trilha/MAPEAMENTO.md`, `processo-trilha.json`) e os ajustes 1–25
de `manual-trilha/AJUSTES-TESTE.md`. Tudo é padrão editável; poucos cliques.

### Etapas e portões
- Fluxo: **Abertura → Estudo Preliminar → Anteprojeto → Executivo → Encerrado**. Projeto Legal corre em paralelo ao
  Anteprojeto. REF e INT pulam Anteprojeto e Legal. O Briefing **não** é etapa do Gestor: fica para o futuro Gestor
  Comercial (oportunidades); até lá, horas de captação vão para a área "Comercial e captação" do Tempo.
- Abertura → EP (marco zero): contrato + 1ª parcela + topográfico + itens da Abertura. Exceção: antecipação com
  Termo de Ciência. AP → Executivo: Legal aprovado, **sem exceção**.
- Prazos em dias úteis (padrão EP 40, AP 70, Executivo 60; editáveis por projeto na Ficha). O prazo pausa enquanto o
  projeto aguarda alguém de fora (cliente, engenheiro, condomínio, prefeitura).
- Projeto já em andamento entra na etapa real (assistente "Já em andamento"): etapas anteriores concluídas, itens
  prontos, datas reais ajustadas depois na Ficha (Datas e prazos das etapas).
- Horas por etapa na Visão geral (etapas do Tempo: `ab` Abertura, `ep`, `ap` + `comp`, `pl`, `ex`, `mc-ep`, `mc-ex`).

### Situação do projeto
- Cliente sem retorno: aviso aos **15 d.u.**; aos **20 d.u.** o projeto vai **sozinho para Suspensos** (cláusula 3.4).
- Suspenso há **mais de 60 d.u.** vai sozinho para **Arquivados**.
- Suspender, arquivar, reativar e desarquivar: botões na página do projeto, sempre com confirmação. Suspenso ou
  arquivado sai da lista principal (quadro de indicadores com filtros: Em andamento, Aguardando, Suspensos, Arquivados).
- `projetos.status` acompanha: suspenso/arquivado → `pausado`; encerrado (sem marcenaria aberta) → `concluido`.
- **Excluir** projeto, pessoa, contato ou obra: **só em Cadastros**, com confirmação. As horas continuam no Tempo.

### Ficha e pavimentos
- A Ficha lê todos os campos antes de gravar e não é redesenhada enquanto há alterações não salvas (antes, dados
  que chegavam do banco — por exemplo o cronômetro de outra pessoa — voltavam os campos ao valor antigo). Ao salvar:
  "Salvando…" → "Salvo ✓" e o aviso "Ficha salva ✓". A mesma proteção vale para o editor de ambiente e as inclusões.
- **Pavimentos editáveis a qualquer momento** (um por linha, comparados pela posição): nome diferente = renomeia nos
  itens, desenhos e ambientes; pavimento a mais = inclui no Plano, nas etapas ainda abertas, os itens por pavimento
  (EP: Planta; AP e Executivo: Planta baixa e os 4 mapeamentos; Legal não aprovado: Planta; Executivo: planta de
  marmoraria, se houver bancadas), cada um na posição certa da série; pavimento a menos = retira, com confirmação,
  só os itens ainda não iniciados (os iniciados ficam). Tudo vai para o Histórico.

### Plano de Projeto
- Itens por etapa e grupo; códigos pela posição (série 100…, AP01…, PL01…, EM01… na marcenaria). Cada item tem
  desenhos/subitens com checklist e link do PDF-guia, prazo, responsável, situação e prioridade P1/P2/P3.
- Termos **não** são itens: são botões no fim da etapa que geram o PDF.
- O cronômetro mede a **prancha (item)**, não cada desenho. Concluir no Meu trabalho manda o item para "Revisão interna".
- **% concluído com peso por etapa** (29/09/2026; editável em Configurações › Peso das etapas, a revisar quando
  houver horas reais): arquitetônico = Estudo Preliminar 30%, Anteprojeto 30%, Projeto Legal 10%, Executivo 30%;
  Abertura não conta. Etapa encerrada vale o peso inteiro; etapa em curso ou futura vale itens prontos ÷ itens da
  etapa (Legal aprovado = inteiro). Etapa que o projeto não tem sai da conta e os pesos restantes são redistribuídos
  na mesma proporção (REF/INT: EP 50% e Executivo 50%; sem Legal: 33% cada).
- **Duas barras quando há marcenaria:** "Projeto arquitetônico concluído" e "Projeto de marcenaria concluído"
  (EP da marcenaria 50%, Executivo da marcenaria 50%), no cabeçalho do projeto e no cartão (barras Arq. e Marc.).
  O cartão mostra também uma barra de prazo para cada trilha (Arq. e Marc.); o quadro de prazo da Visão geral
  mostra só a arquitetura e o quadro Marcenaria mostra o prazo da marcenaria.

### Marcenaria (Interiores) — segunda trilha do mesmo projeto
- Contratada à parte (junto ou depois); fica **dentro do projeto**, aba Plano › Marcenaria, botão verde
  "Marcenaria contratada" (nº/data do contrato, 1ª parcela, prazos digitados pela equipe).
- EP da marcenaria: começa com contrato + 1ª parcela, em paralelo à arquitetura.
- Executivo da marcenaria: começa só com o **Executivo arquitetônico encerrado e o EP da marcenaria encerrado**.
- Itens **não** são gerados sozinhos: "+ Adicionar móvel" usa o **modelo de móvel** (desenhos, checklist e guia),
  editável e guardado em `gp_config/geral`. Série 900 = marcenaria (como no ArchiCAD).
- Depois do termo da arquitetura, o cartão mostra "Arquitetura entregue · marcenaria em andamento"; o projeto só
  encerra quando a marcenaria termina.

### Reuniões, Histórico e termos
- Reunião: marcar antes (vai para a agenda dos participantes; aviso na véspera) ou registrar depois. Ao registrar,
  a duração entra no **Tempo de cada participante** (projeto + etapa) e a reunião vai para o Histórico.
- Histórico: registro fiel com **dia e hora** (etapas, termos, reuniões, itens concluídos, esperas, suspensões,
  alterações). Não se edita nem se apaga; correção é um novo registro. Mostra também horas por etapa, por pessoa e
  por item. Gráficos e comparações entre projetos ficam em Relatórios.
- Termos em PDF (textos em `manual-trilha/TERMOS.md`): Encerramento de Etapa (EP, AP, EP da marcenaria) com quadro
  de anotações opcional; Encerramento de Projeto (Executivo; Executivo da marcenaria) sem anotações; Ciência de
  Antecipação com "o que será antecipado" e anotações. Usam nº/data/cidade do contrato (Ficha) e nome/CPF dos
  clientes (Cadastros). Gerar o PDF fica no Histórico; o termo **assinado** é registrado no botão "Termo assinado".

### Notificações (capa, área da pessoa e topo do Gestor)
1. Prazo chegando ao fim (vermelho): a partir de 10 d.u. antes do fim; depois, "vencido há X d.u.", até resolver.
2. Cliente sem retorno há 15 d.u. (amarelo), até a suspensão automática.
3. Contrato e 1ª parcela ok · pronto para iniciar (verde).
4. Abertura concluída · liberado para a concepção (verde, sócios).
5. Itens da etapa prontos · pronto para o termo (verde).
6. Reunião amanhã / hoje.
Quem vê: sócios veem tudo; colaborador vê os projetos em que tem item ou tarefa pendente e as reuniões de que participa.

### Lista e cartões
- Quadro único de indicadores (também filtra) e botões de etapa com a contagem, que trazem a etapa para o topo.
- Cartão: barra vertical de % do projeto, data final e barra de prazo (verde < 30%, amarela 30–60%, vermelha > 60%;
  listrada quando pausado), bolinhas de **quem tem trabalho pendente** no projeto.

### Programa de necessidades e categorias
- Nomes do briefing; áreas de referência da dimensão Confortável (garagem 18 m²/vaga), editáveis já na criação.
- Categorias: padrão (5 faixas do briefing), dimensão (Compacta/Confortável/Espaçosa), dificuldade do terreno.
- Código do projeto: RES / COM / HOT / REF / INT + nome curto, sem acento e sem número.

### Tarefas de projeto
- Moram na agenda da pessoa (Tarefa, Demanda, Prioridade, Compromisso → Agenda Google), com `projetoId`/`itemId`.
  Trocar o responsável move a tarefa. P1/P2/P3 são dos itens do Plano; Tarefa/Demanda/Prioridade, da agenda.

### Modelo de dados (Gestor e Cadastros)
- `gp/<projetoId>`: `sigla, etapa, fase, etapas{<etapa>: {inicio, fim, termoEm, prazo}}, legal, marco{}, esperas[],
  suspenso{desde, auto}, arquivado{desde, auto}, pavs[], ambientes[], itens[], reunioes[], eventos[], marc{},
  diretrizes{}, proximo, pasta, bimx`.
  - item: `id, etapa, grupo, titulo, sit, resp, prazo, prio, rev, ord, desenhos[{id, nome, feito, checklist[{t, ok}],
    guia}], concluidoEm, ambId, banc, chave, movel`.
  - reunião: `id, tipo, etapa, data, hora, duracao, participantes[], pauta, decisoes, status (marcada|realizada)`.
  - evento: `data, em (ISO), por, txt, tipo (etapa|reuniao|termo|plano|espera|suspensao|arquivamento)`.
  - marc: `ativo, contrato{numero, data}, contratoOk, parcela, prazos{mep, mex}, etapa (aguardando|mep|espera|mex|fim)`.
- `gp_config/geral`: `modeloMovel{guia, desenhos[{nome, checklist[]}], checklist[]}`.
- `projetos/<id>` ganha: `codigo, sigla, clienteIds[], categorias{}, endereco, contrato{numero, data, cidade}`.
- `contatos/<id>`: `tipos[], categoria, nome, contato, empresa, email, doc, razaoSocial, endereco, descricao, observacao`.
- `obras/<id>`: `nome, projetoId, endereco, situacao, observacao`.
- Lançamentos do Tempo podem ter `pranchaId` (item do Plano) e `origem: "reuniao"` + `reuniaoId`.

### Situação dos dados (29/09/2026)
- Residência Paula e Bruno: marcenaria montada pela proposta 140526 (R$ 12.000, EP até 30 d.u., Executivo 40 d.u.):
  20 móveis MOB01–MOB20 (1º pav.: 01–12; 2º pav.: 13–20; MOB20 Roupeiro ainda fora do mapeamento) no EP da
  marcenaria (desenhos Fase 1 · modelo básico e Fase 2 · estudo para apresentação) e no Executivo da marcenaria
  (série 901–920, com o modelo de móvel), mais bônus de iluminação, apresentação, revisão, caderno técnico e
  pré-obra/orçamento. Itens de móvel guardam `mob` e `pav`.
- As 7h20 da Elisa no antigo "Interior - Res Paula e Bruno" (Escritório Bruno) foram para o EP da marcenaria, item
  MOB19, com ajuste registrado em cada lançamento. Excluídos os projetos fora do Gestor (Interior - Res Paula e Bruno,
  Área de Lazer + Piscina - Nara e Márcio, Churrasqueira Rio, Filhos da Fruta, Reforma Guima, Residência Gustavo
  James). **AP001 - Flipping House** continua (fora do Gestor) com as horas de obra, até ser organizado.

### Próximos passos do Gestor
- Luan traz os demais projetos aos poucos pelo "+ Novo projeto" do Gestor.
- Gestor Comercial (oportunidades, briefing, captação), área restrita quando houver colaboradores.
- Revisar o contrato (MAPEAMENTO §11) e completar materiais: pasta padrão, template ArchiCAD, guias em PDF.

## Modelo de dados

- `pessoas/{id}`: `nome`, `perfil` ("socio" | "colaborador"), `custoHora`, `valorHora`, `ativo`, `ordem`.
- `config/escritorio`: `etapas[{id,nome}]`, `areas[{id,nome}]`, `obraTopicos[{id,nome}]`, `tipos[{id,nome}]`,
  `custosFixosMensais`, `horasProdutivasMes`, `pesosEtapas{ep, ap, pl, pe, mep, mex}` (% concluído do Gestor).
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

## Ajustes pendentes (pedidos para a próxima rodada)

Registrados em 29/09/2026 a pedido do Luan, para fazer quando houver um novo ajuste no app:

1. **Prazos padrão em Configurações:** Estudo Preliminar, Anteprojeto e Executivo da arquitetura (hoje fixos em 40,
   70 e 60 d.u. no código) e EP e Executivo da marcenaria (sugestão: 30 e 40 d.u.), logo abaixo de "Peso das etapas".
   Valem para projetos novos; cada projeto continua podendo ter o próprio prazo na Ficha.
2. **Prazos da marcenaria não se ajustam de forma confiável.** Causas prováveis no código: a Ficha grava o prazo em
   `etapas.<mep|mex>.prazo`, mas o cabeçalho de Plano › Marcenaria mostra `marc.prazos` (valor da ativação), que
   não muda; e apagar o prazo na Ficha faz ele voltar ao valor da ativação. Unificar num lugar só.
3. **Regra geral: tudo o que está na Ficha precisa ser editável**, porque os combinados mudam. Conferir campo a
   campo, incluindo: dados do contrato da marcenaria (nº, data, valor, 1ª parcela), prazos e datas de todas as
   etapas (hoje o fim da etapa em curso fica bloqueado), situação do Legal, pavimentos e categorias. Toda alteração
   vai para o Histórico.

## Sugestões da Elisa (aguardando análise do Luan)

_Sugestões 1–7 analisadas e aprovadas pelo Luan em 01/10/2026: ver "Rodada aprovada" abaixo._

Anotadas quando a Elisa (Lili) pede. Não são processadas até o Luan confirmar e analisar cada uma.

### 29/09/2026 — Plano de Projeto › Marcenaria e área da pessoa

1. **Móvel vinculado entre EP e Executivo da marcenaria.** O mesmo mobiliário aparece no Estudo Preliminar da
   marcenaria e no Executivo (pranchas 900). Os dois precisam estar ligados: ao renomear o título no EP, o nome
   muda também no Executivo (hoje não muda).
2. **Móvel modelo a partir de um móvel já configurado.** A Elisa configurou o MOB01 no EP da marcenaria com os
   desenhos, subitens e checklists. Ela quer usar o MOB01 como modelo e aplicar o mesmo padrão a todos os outros
   mobiliários, **só aos móveis**: ficam de fora "Apresentação ao cliente", "Revisão total da proposta" e o bônus de
   iluminação.
3. **Nova situação "Em revisão pelo cliente".** Além de A fazer, Em andamento, Revisão interna, Pronto e Entregue,
   uma etiqueta para quando o material foi enviado ao cliente e está com ele para revisão.
4. **Responsável por etapa inteira.** Hoje o responsável (Elisa ou Luan) é escolhido item a item. Ela quer um
   botão para atribuir a etapa inteira a uma pessoa de uma vez. Depois, se precisar, muda um item ou desenho
   específico individualmente.
5. **Checklist dentro da área pessoal (aba Projetos / Meu trabalho).** O item atribuído aparece na aba Projetos
   da Elisa (ex.: "MOB01 – Chapelaria · Elisa · em andamento"), mas sem acesso aos desenhos e checklists. Ela quer
   abrir o item ali, ver o que já foi cumprido e o que falta em cada desenho, marcar o checklist e iniciar o
   cronômetro do móvel inteiro ou da etapa.
6. **Editar e reordenar desenhos e checklists dentro do item.** Nos desenhos/subitens criados dentro de um móvel
   (ex.: MOB01 › "Planta baixa", "Perspectiva frontal"…), hoje não dá para renomear o desenho nem mudar a ordem:
   fica fixa na ordem em que foram criados. Ela quer poder renomear cada desenho, renomear cada item do checklist
   (ex.: "Cota") e mudar a ordem dos desenhos dentro do item.
7. **Proteção contra apagar sem querer.** Ter como voltar atrás quando algo é apagado por engano, ou pelo menos uma
   pergunta "Quer mesmo apagar?" antes de apagar. Situação hoje no Plano (levantada pelo Claude): remover um item
   (✕) não pergunta, mas mostra "Desfazer" por 10 segundos; remover um desenho/subitem (✕) não pergunta nem tem
   "Desfazer"; remover um ambiente já pede confirmação.

## Rodada aprovada pelo Luan em 01/10/2026 (a processar — aguardando mais pedidos antes de mexer no app)

Junta os "Ajustes pendentes" acima e as sugestões 1–7 da Elisa, com as decisões do Luan. Fazer numa rodada só,
testando antes na cópia de teste (mudança grande).

**A. Ficha e prazos** (pendentes 1–3)
- Prazos padrão em Configurações (arquitetura e marcenaria) e prazo próprio por projeto na Ficha; prazos da marcenaria
  guardados num lugar só; tudo na Ficha editável, inclusive o fim da etapa em curso e o contrato da marcenaria.
- Mudar prazo não é corriqueiro, mas às vezes é necessário: **toda alteração de prazo pede confirmação** (pergunta de
  proteção com o prazo antigo e o novo) e vai para o Histórico.
- Futuro (não agora): **Ficha e Histórico viram áreas restritas**, só Luan e Elisa têm acesso.

**B. Móveis, desenhos e checklists** (Elisa 1, 2, 6)
- Regra: **o Executivo da marcenaria tem sempre os mesmos móveis do EP**. Móvel do EP e do Executivo são vinculados
  (mesmo `mob`): incluir, renomear, reordenar ou retirar um móvel no EP reflete no Executivo. **Os desenhos/subitens e
  checklists de cada um podem ser diferentes** — é justamente aí que EP e Executivo se diferenciam.
- MOB01 da Paula e Bruno como modelo: copiar os desenhos, subitens e checklists dele para os outros móveis da mesma
  etapa (só móveis; ficam de fora apresentação, revisão total e bônus) e oferecer guardar como "Modelo de móvel".
- Renomear desenhos/subitens e itens de checklist e mudar a ordem dos desenhos (e dos itens do checklist).

**C. Situação e responsáveis** (Elisa 3, 4)
- Nova situação **"Em revisão pelo cliente"** (entre Revisão interna e Pronto).
- **No cabeçalho de cada etapa** do Plano: botão para atribuir o responsável da etapa inteira (depois ajusta item a
  item) e a **situação da etapa: finalizada, em andamento ou aguardando**.

**D. Área pessoal** (Elisa 5)
- A área de cada pessoa é a tela mais importante do dia a dia: resolver ali o que é dela sem andar pelo app. Na aba
  Projetos (Meu trabalho): abrir o item, ver e marcar desenhos e checklists, mudar a situação e iniciar o cronômetro
  do móvel/item ou da etapa.

**E. Proteção contra apagar sem querer** (Elisa 7)
- "Desfazer" em toda remoção pequena (item, desenho, item de checklist); confirmação antes de apagar coisas grandes
  (projeto, etapa, ambiente, pessoa, contato).

## Próximos passos previstos

- Acesso por perfil quando houver funcionários: conta Claude separada para a equipe, artefato
  compartilhado com "Pode interagir" e regras de acesso no banco (cada colaborador vê só as próprias
  horas; custos e relatórios só para sócios). Os lançamentos já guardam `pessoaId` para isso.
- Integração com o sistema de orçamento de obra (honorários e etapas).
- Base de precificação: média de horas por etapa e por m², por tipo de projeto.
