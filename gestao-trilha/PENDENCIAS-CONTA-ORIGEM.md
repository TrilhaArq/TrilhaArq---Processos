# Pendências e roteiro para a conta de origem (quem usa o app)

O Gestor Comercial foi desenvolvido por uma **conta de desenvolvimento, convidada de outra organização**. O app de
verdade é usado pela **conta de origem** (Luan e Elisa, dona do app oficial). A conta convidada tem limites:

- não lê nem grava o banco do app pelo Claude Code (ArtifactData recusado para convidados);
- só envia ao armazenamento de arquivos do app **imagens, vídeos, fontes, CSS e scripts** (não aceita texto, CSV, JSON);
- Agenda Google, IA (`sample`) e downloads funcionam com a conta de **quem está usando** o app.

**Regra (vale para todo chat que mexer no app):**
1. Ao trabalhar pela **conta de origem**: ler este arquivo antes de tudo, executar os itens abertos na ordem, **pedir
   autorização ao Luan** antes de cada item marcado com 🔐, e marcar cada item feito com a data e quem fez.
2. Ao trabalhar pela **conta convidada**: acrescentar aqui (no fim da seção certa, com data) tudo o que precisar ser
   feito ou configurado na conta de origem.

Marcação: `[ ]` aberto · `[x] dd/mm/aaaa (quem)` feito · `[~]` não se aplica mais (motivo).

---

## Roteiro para terminar o Gestor Comercial no app oficial (comando do Luan: "terminar o serviço no app oficial")

Situação em 02/10/2026:
- **Oficial** (https://claude.ai/artifact/N5fGJZBumZy7dyN57w7e8o) tem as **fases 1, 2 e 3** (versão 1790906972-5cb0,
  publicada em 02/10/2026 pela conta de desenvolvimento) com `db`, `downloads`, `mcp` Google Calendar (`create_event`,
  `update_event`), `assets` e `sample`, e o `modelos-padrao.json` com os ids do oficial (modelos Residência e Serviço
  menor, contratos 01–07, textos exemplares). **Falta só o que compete à conta de origem: Passos 2 a 4.**
- **Cópia de teste** (https://claude.ai/artifact/V9bUhPfLyowX83XUz5Zeaw) tem a mesma fase 3 (versão 1790906297-dd33).
- **Código:** repositório `TrilhaArq/TrilhaArq---Processos`, ramo `claude/tender-bell-5u0djo`, pasta `gestao-trilha/`.
- Os arquivos dos modelos (páginas, logos e os 7 contratos, inclusive o 07) **já estão no armazenamento do oficial**;
  os ids estão em `referencias-comercial/modelos-padrao-oficial.json`.

### Passo 1 — Publicar a fase 3 no oficial
- [x] 02/10/2026 (conta de desenvolvimento, com autorização do Luan) **1.1** Conferir que nenhum outro chat está publicando no oficial (perguntar ao Luan). 🔐
- [x] 02/10/2026 (conta de desenvolvimento) **1.2** Ler a versão publicada do oficial (Artifact `read` e `list scope files`). Se não for a 1790904962-39e8
  (alguém publicou depois), comparar com o ramo e juntar as mudanças antes de publicar.
- [x] 02/10/2026 (conta de desenvolvimento; versão 1790906972-5cb0, arquivos conferidos byte a byte com o ramo) **1.3** Publicar no oficial: `file_path` = `gestao-trilha/index.html`, `root` = `gestao-trilha`, `files` = `estilo.css`,
  `nucleo.js`, `logo.png`, todos os `modulos/*.js` (inclusive `comercial-docs.js` e `comercial.js`) e
  `"modelos-padrao.json": referencias-comercial/modelos-padrao-oficial.json`. **Sem** passar `capabilities` (mantém as
  cinco). 🔐
- [x] 02/10/2026 (conta de origem, teste automático com os dados reais do banco) **1.4** Abrir o oficial e conferir: capa com "Gestor Comercial", oportunidade abre, Configurações do comercial abre.

### Passo 2 — Configurações que só a conta de origem faz (no próprio app)
- [x] 02/10/2026 (conta de origem, pelo chat: `com_config/modelos` gravado com `modelos-padrao-oficial.json`; cópia de teste também) **2.1 Modelos:** Gestor Comercial › Configurações do comercial › Modelos › **Salvar modelos** (grava
  `com_config/modelos` com os modelos "Residência" e "Serviço menor", os 7 contratos e os textos exemplares).
  Se já tinha salvo antes do Passo 1, os modelos novos (Serviço menor e contrato 07) aparecem mesmo assim (o app
  completa com o arquivo padrão); salvar de novo para gravá-los.
- [ ] **2.2 Contratos como .docx (opcional):** pela conta de origem dá para reenviar cada .docx oficial pelo botão
  "Enviar .docx" (fica como texto). Os enviados pela conta convidada estão como script e funcionam igual.
- [~] **2.3 Prazos padrão** 🔐 (não se aplica: o banco não tem `prazosPadrao` salvo, então já valem os do código — Anteprojeto 80, Reforma 5/30/40; conferido em 02/10/2026): Configurações › Prazos padrão → **Anteprojeto 70 → 80**; conferir Reforma
  (Levantamento 5, EP 30, Executivo 40). O valor salvo no banco vale por cima do código. Alternativa pelo chat da conta
  de origem: ArtifactData `update` em `config/escritorio` (`prazosPadrao.ap = 80`, `refLev 5`, `refEp 30`, `refPe 40`),
  com `if_version`. Projetos existentes mantêm os prazos que têm.
- [ ] **2.4 Padrões de obra:** Configurações › Padrões de obra → conferir as faixas de R$/m² e salvar.
- [ ] **2.5 Valores do Comercial** 🔐 (Luan decide): Configurações do comercial → fatores, horas gerais, horas por
  ambiente, custo-hora reserva (R$ 35), impostos 6% · reserva 10% · lucro 20%, nota fiscal 17%, CAU 8%, mercado
  R$ 70–120/m², meta anual R$ 300 mil, validade 30 dias, adm. de obra 12%, cobrar briefing 5 dias, follow-up 7 dias,
  nº da próxima proposta 81. Ao salvar, o aviso "provisório" some.
- [ ] **2.6 Custo-hora da equipe:** Configurações › Pessoas (custo-hora) e Escritório (custos fixos, horas produtivas).
- [ ] **2.7 Imposto no Financeiro:** Financeiro › Ajustes › reserva de imposto (%), usada pelo Simulador.
- [ ] **2.8 Link do formulário de briefing:** Configurações do comercial → link do Google Forms de residência.
- [ ] **2.9 Planilha de respostas:** no Google Forms, Respostas › Planilha (o app importa colando títulos + linha do cliente).
- [ ] **2.10 Contrato 07 (serviço menor)** 🔐: **revisão jurídica** do modelo curto antes do primeiro uso; se mudar,
  enviar o .docx novo em Configurações do comercial › Modelos de contrato.

### Passo 3 — Conferências no primeiro uso real
- [ ] **3.1 Agenda Google:** na primeira reunião agendada pelo Comercial, conferir o evento na agenda
  `trilha@trilhaarq.com.br` (mesmos campos das Tarefas, mas ainda não verificado com chamada real).
- [ ] **3.2 IA:** primeiro "✨ Escrever com o Claude", "✨ Montar com o Claude" e "Peça ao Claude" pedem autorização;
  conferir a qualidade e o consumo de uso na conta de origem. Ajustar os textos exemplares se preciso.
- [ ] **3.3 Ciclo completo:** uma oportunidade de residência (briefing real → PDF → contrato → virar projeto) e um
  serviço menor (proposta curta → contrato 07 → virar projeto); conferir Word, Financeiro › Contratos e Gestor.
- [ ] **3.4 Gestor:** num projeto de reforma novo, conferir a etapa Levantamento; numa etapa com prazo, testar
  "Registrar rodada" (soma ao prazo e aparece no histórico).
- [ ] **3.5 Páginas do Canva:** na revisão de design, exportar as páginas fixas **sem número de página** e trocar em
  Configurações do comercial › Modelos (páginas com número impresso desalinham quando programa ou plano têm 2 páginas).

### Passo 4 — Registro
- [ ] **4.1** Marcar aqui o que foi feito, atualizar `REGRAS.md` (seções "Fase 3" → "no oficial desde …") e
  `CONTRATO.md` se algo mudou, sincronizar `.claude/skills/gestao-trilha/referencias/` e o `gestao-trilha-skill.zip`,
  commit e push.

---

## Histórico (já feito)

- [x] 02/10/2026 (conta de origem) **Teste geral** com cópia dos dados reais do banco (Playwright, banco simulado congelado):
  capa e todos os apps abrem sem erro; Comercial fluxo completo de **Residência** (contato → agenda → briefing colado →
  programa → simulador → texto com IA → PDF da proposta (1,5 MB) → contrato 01 .docx → assinado → projeto no Gestor + contrato
  no Financeiro) e de **Serviço** (proposta curta → contrato 07 → projeto simples + Financeiro); "Peça ao Claude";
  celular 390 px sem rolagem lateral. Acesso da conta de origem confirmado: lê e grava o banco, lê os arquivos do
  armazenamento (29, inclusive os 7 contratos, que abrem como .docx válidos) e publica no oficial.
- [x] 02/10/2026 (conta de origem) Ajustes publicados no oficial (versão 1790909394-e925) e na cópia de teste: no tipo
  Serviço, a faixa de números mostra horas e prazo (em vez de área e % da obra) e a barra de etapas não mostra as de
  briefing; o aviso "Faltam dados" do contrato usa nomes legíveis ("CPF/CNPJ do cliente (Cadastros)").
- Observação: o documento `gp/` do projeto RES-PAULAEBRUNO tem ~140 KB de 256 KB (190 itens); acompanhar se crescer muito.

- [x] 02/10/2026 (conta de desenvolvimento) Fases 1 e 2 publicadas no oficial com as capacidades `db`, `downloads`,
  `mcp` (Google Calendar), `assets` e `sample`.
- [x] 02/10/2026 (conta de desenvolvimento) Imagens das páginas, logos e os contratos 01–07 enviados ao armazenamento
  do oficial (contratos como script); `modelos-padrao.json` da fase 2 publicado no oficial.
- [x] 02/10/2026 (conta de desenvolvimento) Fase 3 publicada na cópia de teste, com `modelos-padrao-teste.json`.
- [x] 02/10/2026 (conta de desenvolvimento) Fase 3 publicada no oficial (versão 1790906972-5cb0) com `modelos-padrao-oficial.json`.

## Cópia de teste
- [x] 02/10/2026 (conta de origem, pelo chat) Clicar uma vez em **Salvar modelos** na cópia de teste (grava os modelos no banco dela).
- A cópia de teste fica **sem** Agenda Google de propósito (dados fictícios não devem virar eventos reais).
