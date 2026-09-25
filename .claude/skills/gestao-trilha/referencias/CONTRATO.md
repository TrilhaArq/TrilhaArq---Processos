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
mostra o aviso na capa). Módulos novos são testados lá antes de ir para o link oficial.

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

**Regra da capa (decidida pelo Luan):** a capa é só o lugar de entrar. Tem os cartões das pessoas (com o
resumo de Tempo e Tarefas) e um botão por app do escritório, com descrição **fixa**. Nenhum app do escritório
manda dados, números ou avisos para a capa: cada um é "um app dentro do app", com a própria página inicial,
onde ficam os avisos dele (ex.: fechamentos a conferir no topo de Relatórios; parcelas a receber no Painel do
Financeiro). Não existem mais `notes()` nem `onHomeClick()`.
Dentro de um app do escritório, a barra do topo tem **só "← Início"**: não há abas nem atalhos para outros apps
(a navegação entre apps é sempre pela capa). As abas internas de cada app ficam dentro da própria view
(ex.: Painel, Receitas, Despesas, Contratos, Ajustes no Financeiro). Na área da pessoa continuam as abas Tempo e Tarefas.

Adicionar um módulo = criar o arquivo + uma linha `<script src="modulos/<id>.js">` no `index.html` antes de
`Trilha.start()`. Ao ficar pronto, remover o botão "Em breve" correspondente (`FUTUROS` em `nucleo.js`).

Um módulo **não** mexe no HTML nem no estado de outro módulo. Para ler dados de outro módulo, use o objeto que
ele expõe (ex.: `Trilha.tempo.lancAtivos()`, `Trilha.tempo.custoLanc(l)`, `Trilha.relatorios.fechamentos()`,
`Trilha.relatorios.calcFechamento(pid, mes)`).

## 3. O que o núcleo oferece (`window.Trilha`, abreviado `T`)

- Estado: `T.state.pessoas`, `T.state.projetos`, `T.state.config`, `T.state.pessoaId` (pessoa aberta),
  `T.state.view` (`home` | `pessoa` | `admin`), `T.state.sub` (módulo aberto).
- Dados comuns: `T.pessoa(id)`, `T.pessoasAtivas()`, `T.projeto(id)`, `T.cfg()` (config com padrões),
  `T.etapaNome`, `T.areaNome`, `T.topicoNome`, `T.tipoNome`, `T.custoHoraTotal(pid)`, `T.rateioHora()`,
  `T.saveConfig(patch)`.
- Banco e capacidades: `T.db`, `T.downloads`, `T.mcp` (podem ser `null`: esconder o recurso).
- Navegação e desenho: `T.go(view, sub, pid)`, `T.render()`, `T.scheduleRender()`.
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
  `fechamentos` (Relatórios). Um módulo novo usa coleções com o próprio prefixo/nome e as documenta aqui.
- Toda gravação feita pelo Claude no chat (ArtifactData) usa `if_version` do documento lido.
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

## 6. Módulos

| Módulo | Arquivo | Área | Situação |
|---|---|---|---|
| Tempo | `modulos/tempo.js` | pessoa | em uso |
| Tarefas | `modulos/tarefas.js` | pessoa | em uso |
| Projetos (cadastro) | `modulos/projetos.js` | admin | em uso — será ampliado pelo Gestor de Projetos |
| Relatórios | `modulos/relatorios.js` | admin | em uso |
| Configurações | `modulos/config.js` | admin | em uso |
| Financeiro | `modulos/financeiro.js` | admin | v1 em teste na cópia https://claude.ai/artifact/V9bUhPfLyowX83XUz5Zeaw (dados fictícios); ainda não publicado no app oficial |
| Gestor de projetos | — | admin | "Em breve" na capa |
| Gestor de obras (orçamento de obras) | — | admin | "Em breve" na capa — portar o app de orçamento (skill orcamento-obra-trilha), itens agrupados por obra |
