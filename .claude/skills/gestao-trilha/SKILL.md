---
name: gestao-trilha
description: Regras para desenvolver, corrigir ou ampliar o app "Gestão Trilha" (Artifact modular de gestão do escritório Trilha Arquitetura Brasileira — tempo, tarefas, Gestor de Projetos, cadastros, financeiro, horas e custos, relatórios, configurações e os próximos módulos, como Gestor Comercial e Gestor de Obras). Use sempre que o pedido envolver esse app, um módulo novo para ele, seus dados (horas, tarefas, projetos, fechamentos) ou o link claude.ai/artifact/N5fGJZBumZy7dyN57w7e8o.
---

# Gestão Trilha — como trabalhar no app

App de gestão do escritório **Trilha Arquitetura Brasileira** (usuários: Luan e Elisa, sócios, mesma conta Claude).
Um único Artifact, organizado em **módulos**, com um único banco de dados compartilhado.

- **Link (sempre o mesmo):** https://claude.ai/artifact/N5fGJZBumZy7dyN57w7e8o
- **Código:** repositório GitHub `TrilhaArq/TrilhaArq---Processos`, pasta `gestao-trilha/`
- **Regras comuns:** `referencias/CONTRATO.md` (ler antes de qualquer alteração)
- **Regras de negócio dos módulos atuais:** `referencias/REGRAS.md`
- **Processo de projeto da Trilha (base do Gestor):** `manual-trilha/` no repositório (MAPEAMENTO.md,
  processo-trilha.json, AJUSTES-TESTE.md com as decisões do Luan, TERMOS.md com os textos dos termos)

## Princípios que não se reabrem sem pedido explícito

1. Tudo fica **num único app, no mesmo link**, para que os módulos compartilhem dados (pessoas, projetos,
   custos). Um módulo novo nasce como `modulos/<id>.js` deste app, não como outro Artifact.
2. **Capa** = hub: notificações no topo (só as do Gestor de Projetos, via `notes()`), botões das pessoas (área
   "pessoa": Tempo, Tarefas, Projetos) e botões do Escritório nesta ordem: Gestor de Projetos, Gestor de obras
   (em breve), Gestor Comercial (em breve), Financeiro, Relatórios (com a aba Horas e custos), Configurações,
   Cadastros. Cada app do escritório abre sozinho, só com "← Início".
3. **Banco:** limite de 5.000 documentos por Artifact → registros numerosos agrupados em um documento por
   pessoa/mês ou por mês/obra, com `itens[]`. Gravações pelo chat usam `if_version`.
4. **Identidade visual Trilha:** verde-sálvia #88AC67, neutros oklch esverdeados, Comfortaa + Work Sans,
   cards com borda de 1px e raio de 10px, temas claro e escuro, funciona no celular. Só classes de `estilo.css`.
5. **Tempo:** mês de 1º ao último dia; semana de segunda a domingo; semanas anteriores só mudam com justificativa.
6. Ajustes em textos, botões e confirmações sempre visíveis ao usuário ("Salvando…" → "Salvo ✓").
7. **Celular e computador:** seguir as regras de layout do `CONTRATO.md` §5 e conferir com imagem em 390 px e
   1280 px antes de publicar. Excluir, suspender e arquivar sempre com `T.confirmar`.
8. **Nada é rígido:** listas, prazos, modelos e textos são padrões editáveis pelo usuário.

## Fluxo de trabalho em cada pedido

1. **Pegar a versão atual:** ler os arquivos publicados do Artifact (ação `read` com `path` de cada arquivo:
   `index.html`, `estilo.css`, `nucleo.js`, `modulos/*.js`) ou clonar o repositório. Os dois devem estar iguais;
   se divergirem, a versão publicada vale e o repositório é atualizado.
2. **Alterar só o necessário**, no arquivo do módulo envolvido. Núcleo e `estilo.css` só mudam quando algo é
   comum a vários módulos.
3. **Testar** antes de publicar: `node --check` em cada `.js` e a página aberta no Playwright com um banco simulado
   (mock de `window.claude.use('db')` com os dados reais lidos por ArtifactData), servida por `page.route` (não
   `file://`, que bloqueia o PDF do logo), em 390 px e 1280 px, sem erros no console.
4. **Publicar** no mesmo link: `url` = link acima, `file_path` = `index.html`, `root` = pasta do app, `files`
   com todos os arquivos. Não alterar `capabilities` sem necessidade (hoje: `db`, `downloads` e `mcp` com
   Google Calendar `create_event`/`update_event`); ao declarar uma nova, repetir as existentes.
5. **Atualizar a documentação:** `REGRAS.md` (regras de negócio) e, se mudou a arquitetura, `CONTRATO.md`.
   Se houver acesso ao repositório, commit e push.
6. **Um chat por vez** publicando no app, para um não sobrescrever o trabalho do outro.
7. **Dados reais pelo chat** (ex.: lançar um projeto já em andamento): preferir montar pelo próprio app no teste
   (assistente "Já em andamento") e gravar com ArtifactData em lote, com `if_version` nos documentos existentes.

## Como criar um módulo novo (ex.: Financeiro)

1. Ler `CONTRATO.md` (seção "Como um módulo se registra").
2. Combinar com o usuário o escopo da primeira versão; usar os dados comuns (`T.state.projetos`,
   `T.state.pessoas`, `T.custoHoraTotal`, `Trilha.tempo.*`) em vez de recadastrar.
3. Criar `modulos/<id>.js` com `Trilha.register({ id, label, area, html, init, render, connect, icon, desc })`.
4. Acrescentar `<script src="modulos/<id>.js">` no `index.html` antes de `Trilha.start()` e retirar o item
   correspondente de `FUTUROS` em `nucleo.js` (botão "Em breve").
5. Documentar as coleções novas no `CONTRATO.md` e as regras do módulo no `REGRAS.md`.

## Comportamento com o usuário

- Responder em português do Brasil, com linguagem de arquiteto/gestor (não de programador).
- Quando o usuário pedir "só responder" ou "não processar ainda", responder sem alterar o app.
- Explicar custos e riscos de forma direta; recomendar em vez de listar opções sem posição.
- **Quando a pessoa disser que é a Elisa (Lili):** só anotar as sugestões dela, sem alterar o app nem os dados, e
  pedir que o Luan confirme e analise antes de qualquer processamento. As sugestões ficam em `REGRAS.md`, seção
  "Sugestões da Elisa (aguardando análise do Luan)", até o Luan aprovar, ajustar ou recusar cada uma.
