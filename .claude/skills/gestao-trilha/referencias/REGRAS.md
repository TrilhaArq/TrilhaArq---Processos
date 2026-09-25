# Gestão Trilha — regras dos módulos Tempo, Tarefas, Projetos, Relatórios e Configurações

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

- **Capa (página inicial):** avisos (fechamentos mensais a conferir), botões das pessoas (Luan, Elisa) com
  horas do mês, tarefas a fazer e atrasadas, e botões administrativos: Projetos, Relatórios, Configurações.
- **Área da pessoa:** abas **Tempo** e **Tarefas**, mais "← Início". Cabeçalho padrão com o nome da pessoa.
- **Área administrativa:** abas Projetos, Relatórios e Configurações.
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
   mês anterior de cada pessoa (horas, dias, média por dia, valor-hora, valor a pagar) e mostra um aviso na
   capa até alguém clicar em "Conferido". Se houver ajustes depois, Relatórios avisa e permite atualizar.
9. **Lançamento manual:** data, início, fim, onde, etapa, descrição. Fim menor que início = passou da meia-noite.
   Limite de 16 h por lançamento.
10. **Semana fechada:** a semana vai de segunda a domingo. Incluir, editar ou excluir lançamento de semana
    anterior exige justificativa (mínimo 5 caracteres), registrada em `ajustes` com data, pessoa, ação e
    valores anteriores. Exclusão em semana fechada é lógica (`excluido: true`); na semana atual é definitiva.
11. **Custos:**
    - custo-hora da pessoa (opcional) = quanto a hora custa ao escritório;
    - rateio = custos fixos mensais ÷ (horas produtivas por pessoa × nº de pessoas ativas); padrão 112 h;
    - custo-hora total = custo-hora da pessoa + rateio;
    - custo do lançamento = horas × custo-hora total (calculado com os valores **atuais**; mudar o
      custo-hora recalcula o histórico — ponto a evoluir).
    Sem custo-hora preenchido, o app mostra "—" e pede o dado, nunca zero.
12. **Projetos:** nome, cliente, tipo, área (m²), honorário, situação (ativo/pausado/concluído) e horas
    previstas por etapa (opcional). Card mostra horas, custo, horas/m², custo/m², margem e barras de
    previsto × realizado (âmbar a partir de 80%, vermelho acima de 100%).
13. **Relatórios** (filtro por período e pessoa): resumo, por pessoa (horas, dias, média/dia, % em projetos,
    valor a pagar), por projeto, por etapa, áreas internas, por atividade (15 mais frequentes) e
    fechamento mensal por pessoa (entrada, saída e horas por dia, total e valor a pagar = horas ×
    valor-hora de pagamento). Exportação em CSV (separador `;`, compatível com Excel em português).
14. **Identidade visual:** a mesma do gestor de tarefas — verde-sálvia #88AC67, neutros oklch levemente
    esverdeados, Comfortaa em títulos e rótulos, Work Sans no texto, cards com borda de 1px e raio de 10px,
    pills, logo preta no canto superior direito invertida no tema escuro.

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
- Guardar o custo-hora vigente em cada lançamento, para o histórico não mudar quando o valor mudar.
- Integração com o sistema de orçamento de obra (honorários e etapas).
- Base de precificação: média de horas por etapa e por m², por tipo de projeto.
