---
name: gestao-trilha
description: Regras para desenvolver, corrigir ou ampliar o app "Gestão Trilha" (Artifact modular de gestão do escritório Trilha Arquitetura Brasileira — tempo, tarefas, projetos, relatórios, configurações e os próximos módulos, como Financeiro e Gestor de Projetos). Use sempre que o pedido envolver esse app, um módulo novo para ele, seus dados (horas, tarefas, projetos, fechamentos) ou o link claude.ai/artifact/N5fGJZBumZy7dyN57w7e8o.
---

# Gestão Trilha — como trabalhar no app

App de gestão do escritório **Trilha Arquitetura Brasileira** (usuários: Luan e Elisa, sócios, mesma conta Claude).
Um único Artifact, organizado em **módulos**, com um único banco de dados compartilhado.

- **Link (sempre o mesmo):** https://claude.ai/artifact/N5fGJZBumZy7dyN57w7e8o
- **Cópia de teste (dados fictícios, sem Google Agenda):** https://claude.ai/artifact/V9bUhPfLyowX83XUz5Zeaw —
  módulos novos (hoje o Financeiro v1) são testados lá antes de ir para o link oficial.
- **Código:** repositório GitHub `TrilhaArq/TrilhaArq---Processos`, pasta `gestao-trilha/`
- **Regras comuns:** `referencias/CONTRATO.md` (ler antes de qualquer alteração)
- **Regras de negócio dos módulos atuais:** `referencias/REGRAS.md`

## Princípios que não se reabrem sem pedido explícito

1. Tudo fica **num único app, no mesmo link**, para que os módulos compartilhem dados (pessoas, projetos,
   custos). Um módulo novo nasce como `modulos/<id>.js` deste app, não como outro Artifact.
2. **Capa** = hub: avisos no topo, botões das pessoas (área "pessoa": Tempo, Tarefas) e botões do Escritório
   (área "admin": Projetos, Relatórios, Configurações, e os futuros Financeiro e Gestor de Projetos).
3. **Banco:** limite de 5.000 documentos por Artifact → registros numerosos agrupados em um documento por
   pessoa/mês ou por mês/obra, com `itens[]`. Gravações pelo chat usam `if_version`.
4. **Identidade visual Trilha:** verde-sálvia #88AC67, neutros oklch esverdeados, Comfortaa + Work Sans,
   cards com borda de 1px e raio de 10px, temas claro e escuro, funciona no celular. Só classes de `estilo.css`.
5. **Tempo:** mês de 1º ao último dia; semana de segunda a domingo; semanas anteriores só mudam com justificativa.
6. Ajustes em textos, botões e confirmações sempre visíveis ao usuário ("Salvando…" → "Salvo ✓").

## Fluxo de trabalho em cada pedido

1. **Pegar a versão atual:** ler os arquivos publicados do Artifact (ação `read` com `path` de cada arquivo:
   `index.html`, `estilo.css`, `nucleo.js`, `modulos/*.js`) ou clonar o repositório. Os dois devem estar iguais;
   se divergirem, a versão publicada vale e o repositório é atualizado.
2. **Alterar só o necessário**, no arquivo do módulo envolvido. Núcleo e `estilo.css` só mudam quando algo é
   comum a vários módulos.
3. **Testar** antes de publicar (sintaxe de cada `.js`; se possível, abrir a página com um banco simulado).
4. **Publicar** no mesmo link: `url` = link acima, `file_path` = `index.html`, `root` = pasta do app, `files`
   com todos os arquivos. Não alterar `capabilities` sem necessidade (hoje: `db`, `downloads` e `mcp` com
   Google Calendar `create_event`/`update_event`); ao declarar uma nova, repetir as existentes.
5. **Atualizar a documentação:** `REGRAS.md` (regras de negócio) e, se mudou a arquitetura, `CONTRATO.md`.
   Se houver acesso ao repositório, commit e push.
6. **Um chat por vez** publicando no app, para um não sobrescrever o trabalho do outro.

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
