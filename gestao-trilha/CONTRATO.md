# Gestão Trilha — contrato do sistema

Regras comuns que **todo módulo** do app Gestão Trilha segue. Leia antes de criar ou alterar um módulo.
Regras de negócio de cada módulo existente: `REGRAS.md`.

- Artefato (sempre o mesmo link): https://claude.ai/artifact/N5fGJZBumZy7dyN57w7e8o
- Código: esta pasta (`gestao-trilha/`), no repositório TrilhaArq---Processos.

## 1. Estrutura de arquivos

```
index.html          casca: capa, cabeçalho, barra de abas, <script> de cada módulo, Trilha.start()
estilo.css          identidade visual Trilha (tokens claro/escuro, componentes)
nucleo.js           window.Trilha: utilidades, banco, pessoas, projetos, config, custos, navegação, capa
logo.png            logo preta (invertida no tema escuro)
modulos/<id>.js     um arquivo por módulo
```

**Cópia de teste:** https://claude.ai/artifact/V9bUhPfLyowX83XUz5Zeaw — mesmos arquivos, `<title>` "Gestão Trilha Teste",
capacidades só `db` e `downloads` (sem Google Agenda) e banco próprio com dados fictícios (`fin_config/geral.teste = true`
mostra o aviso na capa). **Decisão do Luan (29/09/2026):** a cópia de teste fica parada e
desatualizada; ajustes do dia a dia vão direto ao oficial. Quando houver um **grande ajuste** (módulo novo ou mudança
estrutural), atualizar a cópia de teste primeiro com todos os arquivos do oficial (só muda o `<title>`), testar lá e
depois levar ao oficial. Não excluir a cópia: o banco dela guarda os dados fictícios de teste. A antiga cópia de teste do Gestor de Projetos
(https://claude.ai/artifact/MCRcCpLbCTKURD3qUb6Wmx, com projetos de exemplo) ficou superada pelo oficial e não é mais atualizada.

Publicar sempre com `url` = link acima, `file_path` = `index.html`, `root` = esta pasta e `files` listando
**todos** os arquivos (estilo.css, nucleo.js, logo.png e cada `modulos/*.js`). Não mudar `capabilities` sem
necessidade (hoje: `db`, `downloads`, `mcp` Google Calendar com `create_event`/`update_event`); para declarar
uma nova capacidade, repetir as existentes.

**Um chat por vez** publicando neste artefato. Antes de começar, ler a versão publicada (Artifact `read`) ou o
repositório, que precisam estar iguais.

## 2. Como um módulo se registra

Cada `modulos/<id>.js` é uma função autoexecutável que chama `Trilha.register({...})`:

| Campo | Obrigatório | Para quê |
|---|---|---|
| `id` | sim | identificador curto; a view vira `#view-<id>` |
| `label` | sim | nome da aba e do botão |
| `area` | sim | `"pessoa"` (aba dentro da área de cada pessoa) ou `"admin"` (botão em Escritório) |
| `html` | sim | HTML da view (injetado pelo núcleo) |
| `init(T)` | sim | liga os eventos da própria view |
| `render()` | sim | redesenha a view com o estado atual |
| `connect(db)` | não | assina as coleções do módulo (`onSnapshot`) |
| `icon`, `desc()` | admin | SVG (paths, 24×24, só traço) e descrição curta do botão na capa |
| `homeStats(pid)` | não | só módulos da área "pessoa" (Tempo, Tarefas): números no cartão da pessoa `[{label, value, alert}]` |
| `homeState(pid)` | não | só módulos da área "pessoa": linha de estado no cartão da pessoa (HTML curto) |
| `onLoaded(key)` | não | chamado quando uma coleção chega do servidor |
| `notes(pessoaId)` | não | notificações (HTML) — `null` na capa; o id da pessoa na área dela |

**Regra da capa (atualizada pelo Luan em 29/09/2026):** a capa é o lugar de entrar (cartões das pessoas e um
botão por app do escritório, com descrição fixa) **e** o lugar das notificações, porque o app fica aberto numa
segunda tela o dia todo. Só entram na capa as notificações de `notes(null)` (hoje, só as do Gestor de Projetos);
números e resumos de cada app continuam dentro do próprio app. Na área da pessoa, as mesmas notificações
aparecem acima das abas, filtradas por `notes(pessoaId)`. Não existe `onHomeClick()`: um aviso que abre algo usa
um atributo tratado pelo próprio módulo (ex.: `data-gpopen` no Gestor).
Dentro de um app do escritório, a barra do topo tem **só "← Início"**: não há abas nem atalhos para outros apps
(a navegação entre apps é sempre pela capa). As abas internas de cada app ficam dentro da própria view.
Na área da pessoa continuam as abas Tempo, Tarefas e Projetos (Meu trabalho).

Adicionar um módulo = criar o arquivo + uma linha `<script src="modulos/<id>.js">` no `index.html` antes de
`Trilha.start()`. Ao ficar pronto, o botão "Em breve" com o mesmo id (`FUTUROS` em `nucleo.js`) some sozinho; use o
id previsto (`obras`, `comercial`). A ordem dos botões do Escritório está em `ORDEM_CAPA` (`nucleo.js`): gestor,
obras, comercial, financeiro, relatorios, config, cadastros; módulo fora da lista vai para o fim.

Um módulo **não** mexe no HTML nem no estado de outro módulo. Para ler dados de outro módulo, use o objeto que
ele expõe (ex.: `Trilha.tempo.lancAtivos()`, `Trilha.tempo.custoLanc(l)`, `Trilha.tempo.lancar(l)`,
`Trilha.relatorios.fechamentos()`, `Trilha.relatorios.calcFechamento(pid, mes)`, `Trilha.gestor.*`,
`Trilha.cadastros.contato(id)`, `Trilha.cadastros.editarProjeto(pid)`, `Trilha.tarefas.criar(pid, item)`,
`Trilha.gestor.corpoItem(pid, item)` + `Trilha.gestor.ligarCorpo(elemento)` para mostrar e editar desenhos e
checklists de um item fora do Gestor, como faz a área da pessoa).

## 3. O que o núcleo oferece (`window.Trilha`, abreviado `T`)

- Estado: `T.state.pessoas`, `T.state.projetos`, `T.state.config`, `T.state.pessoaId` (pessoa aberta),
  `T.state.view` (`home` | `pessoa` | `admin`), `T.state.sub` (módulo aberto).
- Dados comuns: `T.pessoa(id)`, `T.pessoasAtivas()`, `T.projeto(id)`, `T.cfg()` (config com padrões),
  `T.etapaNome`, `T.areaNome`, `T.topicoNome`, `T.tipoNome`, `T.custoHoraTotal(pid)`, `T.rateioHora()`,
  `T.DEFAULT_CONFIG.pesosEtapas` (pesos do % concluído; `T.gestor.pct(pid)` e `T.gestor.pctMarc(pid)`),
  `T.saveConfig(patch)`.
- Banco e capacidades: `T.db`, `T.downloads`, `T.mcp` (podem ser `null`: esconder o recurso).
- Navegação e desenho: `T.go(view, sub, pid)`, `T.render()`, `T.scheduleRender()`.
- Confirmação: `await T.confirmar({ titulo, texto, ok, perigo })` → `true`/`false` (janela com Confirmar/Cancelar).
  Obrigatória antes de excluir, suspender, arquivar ou reabrir qualquer registro.
- Avisos: `T.toast(msg, {label, fn})`, `T.showError(e)`, `T.saveWith(botao, asyncFn)` (mostra
  "Salvando…" → "Salvo ✓" ao lado do botão — usar em **todo** botão Salvar).
- Utilidades: `T.$`, `T.esc`, `T.ymd`, `T.hm`, `T.fmtH`, `T.fmtBRL`, `T.fmtNum`, `T.fmtData`, `T.mesAtual`,
  `T.weekStart`, `T.clone`, `T.novoId`, `T.byId`, `T.snapList`, `T.arrDocs`, `T.optHtml`, `T.each`, `T.ls`.
- Aparelho atual: `T.device = {id, nome}`.

## 4. Banco de dados

- Limite do artefato: **5.000 documentos** e 256 KB por documento. Registros numerosos (lançamentos,
  movimentações financeiras) ficam **agrupados** num documento por pessoa/mês ou por mês, com a lista em
  `itens[]` (ver `lancamentos/<pessoa>_<AAAA-MM>`). Nunca um documento por lançamento.
- Coleções comuns (núcleo): `pessoas/<id>`, `projetos/<id>`, `config/escritorio`. Módulos podem acrescentar
  campos a `projetos` (ex.: `perfil`, usado na precificação), mas nunca renomear ou apagar os existentes.
- Coleções de módulos em uso: `lancamentos`, `atividades`, `timers` (Tempo); `tarefas` (Tarefas);
  `fin_config`, `fin_contratos`, `fin_mov`, `fin_recorrentes` (Financeiro);
  `fechamentos` (Relatórios); `gp`, `gp_config` (Gestor de Projetos); `contatos`, `obras` (Cadastros). Um módulo novo usa coleções com o próprio prefixo/nome e as documenta aqui.
- Toda gravação feita pelo Claude no chat (ArtifactData) usa `if_version` do documento lido.
- **Documentos do banco chegam somente-leitura** (`d.data()` é congelado no app real): nunca alterar o objeto
  recebido; copiar com `T.clone` antes de ajustar formatos antigos. Nos testes, o banco simulado deve congelar os
  dados (`Object.freeze` em profundidade) — foi esse erro que deixou o Gestor vazio em 01/10/2026.
- Datas: ISO (`toISOString`) para instantes; `AAAA-MM-DD` para dias; `AAAA-MM` para meses. Valores em reais
  como número (sem formatação). Mês = do dia 1º ao último; semana = segunda a domingo.

## 5. Visual e texto

- Usar só as classes de `estilo.css`: `card`, `panel`, `btn` (`btn-primary`, `btn-small`, `btn-stop`),
  `seg-pill`, `pill`, `tile`, `table-wrap`, `section-head` + `section-title`, `grid-form` + `field` + `col-*`,
  `empty`, `hint`. Cores sempre pelos tokens (`var(--accent)` etc.), nunca valores soltos.
- Identidade: verde-sálvia #88AC67, neutros oklch levemente esverdeados, Comfortaa em títulos e rótulos,
  Work Sans no texto, cards com borda de 1px e raio de 10px.
- Textos em português do Brasil, frases curtas, botões dizendo a ação ("Salvar projeto", "Concluir").
- Funciona em celular (~400 px) e nos temas claro e escuro.
- **Regras de layout (celular e computador), conferidas com imagem em 390 px e 1280 px antes de publicar:**
  1. nada com largura fixa que estoure a tela (grades com `minmax(0, 1fr)`, quebra de linha); a página nunca rola
     para o lado;
  2. linhas de lista (Plano, Meu trabalho): título com peso à esquerda; controles compactos à direita no
     computador e numa linha abaixo no celular (até 760 px);
  3. controles dentro de listas no tamanho compacto (28 px de altura, 12 px); botões principais da página
     continuam `btn`;
  4. barras, listas e cartões ocupam a largura toda do quadro;
  5. tabela que pode ficar larga usa `table-wrap as-list` (vira lista de cartões no celular; `data-l` nas células
     dá o rótulo);
  6. resumos numéricos num **quadro único** (`gp-strip`, `gp-resumo`, `fin-hero`/`fin-next`), com as células
     separadas por fio, nunca vários quadrinhos soltos;
  7. exclusão, suspensão e arquivamento sempre com `T.confirmar`.

## 6. Módulos

| Módulo | Arquivo | Área | Situação |
|---|---|---|---|
| Tempo | `modulos/tempo.js` | pessoa | em uso |
| Tarefas | `modulos/tarefas.js` | pessoa | em uso |
| Meu trabalho (aba "Projetos" da pessoa) | `modulos/meutrabalho.js` | pessoa | em uso |
| Gestor de Projetos | `modulos/gestor.js` | admin | em uso (oficial desde 29/09/2026) |
| Cadastros | `modulos/cadastros.js` | admin | em uso (único lugar para excluir projetos, pessoas e contatos) |
| Financeiro | `modulos/financeiro.js` | admin | em uso (v1 no app oficial desde set/2026) |
| Horas e custos (antigo "Projetos") | `modulos/projetos.js` | aba de Relatórios | em uso — não se registra como módulo: expõe `T.horasCustos {html, init, render}` e Relatórios o mostra na aba "Horas e custos por projeto" |
| Relatórios | `modulos/relatorios.js` | admin | em uso |
| Configurações | `modulos/config.js` | admin | em uso |
| Gestor Comercial (oportunidades, briefing) | — | admin | "Em breve" na capa; aprovado, para depois (ver REGRAS.md) |
| Gestor de obras (orçamento de obras) | — | admin | "Em breve" na capa — portar o app de orçamento (skill orcamento-obra-trilha), itens agrupados por obra |
