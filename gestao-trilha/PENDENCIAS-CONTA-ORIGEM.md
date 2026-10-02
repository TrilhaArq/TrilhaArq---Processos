# Pendências para a conta de origem (quem usa o app)

O desenvolvimento do Gestor Comercial é feito por uma **conta de desenvolvimento, convidada de outra organização**.
O app de verdade é usado pela **conta de origem** (Luan e Elisa, dona do app oficial). A conta convidada tem limites:

- não lê nem grava o banco do app pelo Claude Code (ArtifactData recusado para convidados);
- só envia ao armazenamento de arquivos do app **imagens, vídeos, fontes, CSS e scripts** (não aceita texto, CSV, JSON);
- o Google Agenda, a IA (`sample`) e os downloads funcionam com a conta de **quem está usando** o app.

Por isso, algumas coisas só podem (ou devem) ser feitas na conta de origem. **Regra:** ao atualizar o app pela
conta de origem, o Claude lê este arquivo, executa as pendências abertas (pedindo autorização ao Luan quando o item
pede) e marca cada uma como feita, com a data. Itens novos entram no fim, com data e origem.

## Como marcar
`[ ]` aberta · `[x] dd/mm/aaaa` feita (quem fez) · `[~]` não se aplica mais (motivo)

---

## A. Ao publicar o Gestor Comercial no app oficial (fases 1 e 2, de 02/10/2026)

- [ ] **A1. Capacidades do oficial.** Publicar com `db`, `downloads`, `mcp` (Google Calendar `create_event`,
  `update_event`) **e** as novas `assets` (arquivos dos modelos) e `sample` (IA). Ao declarar, repetir todas.
  *Pode ser feito pela conta de desenvolvimento (é editora do oficial).*
- [ ] **A2. Arquivos dos modelos no oficial.** Enviar ao armazenamento do oficial as imagens de
  `referencias-comercial/paginas/` (capa, páginas fixas, logo e assinatura) e os 6 contratos.
  - Contratos: pela conta de origem, em **Configurações do comercial › Modelos de contrato › Enviar .docx**
    (o app guarda o .docx como texto base64). Pela conta convidada só dá como script (`"<base64>";`), que o app
    também lê. Os .docx oficiais **não** ficam no repositório (CPF e dados bancários).
  - Os ids dos arquivos são próprios de cada artefato: os da cópia de teste **não** servem no oficial.
- [ ] **A3. Modelos no banco.** Depois de A2, abrir Gestor Comercial › Configurações do comercial › Modelos e
  clicar **Salvar modelos** (grava `com_config/modelos`). Enquanto não salvar, o app usa o arquivo
  `modelos-padrao.json` publicado junto (só leitura). Alternativa pela conta de origem: gravar
  `com_config/modelos` direto com ArtifactData a partir de `referencias-comercial/modelos-template.json`
  (trocando os `ID_…` pelos ids do oficial).
- [ ] **A4. Prazos padrão (decisão de 01/10/2026: prazos seguem os contratos, maior número da faixa).**
  O banco guarda os prazos salvos em Configurações e eles valem por cima do código: em **Configurações › Prazos
  padrão**, mudar **Anteprojeto de 70 para 80** e conferir Reforma (Levantamento 5, EP 30, Executivo 40).
  Pela conta de origem também dá por ArtifactData em `config/escritorio.prazosPadrao` (com `if_version`).
  Projetos que já existem mantêm os prazos que têm.
- [ ] **A5. Padrões de obra.** Em **Configurações › Padrões de obra**, conferir as faixas de R$/m² (vêm com as da
  proposta do Gustavo: Médio 3.000–3.500 · Médio Alto 3.500–4.500 · Alto 4.500–5.500 · Alto 5.500–7.000 ·
  Luxo acima de 7.000) e salvar.
- [ ] **A6. Valores provisórios do Comercial (Luan decide).** Em **Gestor Comercial › Configurações do comercial**:
  fatores (padrão, dimensão, terreno, cliente), horas gerais e horas por ambiente, custo-hora reserva (R$ 35,
  só enquanto a equipe não tem custo-hora), impostos 6% · reserva 10% · lucro 20%, nota fiscal 17%, CAU 8%,
  mercado R$ 70–120/m², meta anual R$ 300 mil, validade 30 dias, adm. de obra 12%, cobrança do briefing 5 dias,
  follow-up 7 dias, nº da próxima proposta 81. Ao salvar, o aviso "provisório" some.
- [ ] **A7. Custo-hora da equipe.** Em **Configurações › Pessoas** (custo-hora) e **Escritório** (custos fixos e
  horas produtivas): sem isso o Simulador usa o custo-hora reserva.
- [ ] **A8. Imposto no Financeiro.** Em Financeiro › Ajustes, a reserva de imposto (%) — o Simulador usa esse valor.
- [ ] **A9. Link do formulário de briefing.** Em Configurações do comercial, colar o link do Google Forms de
  residência (entra na mensagem de WhatsApp "Enviar briefing").
- [ ] **A10. Planilha de respostas.** No Google Forms, ligar o formulário a uma planilha (Respostas › Planilha):
  o app importa colando a linha de títulos + a linha do cliente.
- [ ] **A11. Agenda Google.** Na primeira reunião agendada pelo Comercial no oficial, confirmar que o evento entrou
  na agenda `trilha@trilhaarq.com.br` (a cópia de teste não tem a Agenda). O conector Google Calendar precisa estar
  ligado na conta de quem usa.
- [ ] **A12. IA (`sample`).** Na primeira vez que alguém clicar em "✨ Escrever com o Claude", o Claude pede
  autorização; cada pedido consome o uso da conta de quem clica. Conferir a qualidade do texto e, se preciso,
  ajustar os textos exemplares (Configurações do comercial › Jeito Trilha de escrever).
- [ ] **A13. Primeiro uso real.** Fazer uma oportunidade do início ao fim (briefing real → proposta PDF → contrato
  → virar projeto) e conferir: contrato .docx aberto no Word, parcelas em Financeiro › Contratos, projeto no Gestor.
- [ ] **A14. Páginas do Canva.** Quando houver a revisão de design das propostas, exportar as páginas fixas **sem
  número de página** (o app numera as variáveis; páginas fixas com número impresso ficam desalinhadas quando o
  programa ou o plano ocupam mais de uma página) e trocar em Configurações do comercial › Modelos.

## B. Cópia de teste

- [ ] **B1.** Na cópia de teste, clicar uma vez em **Salvar modelos** (Configurações do comercial) para gravar os
  modelos no banco dela. (Ids dos arquivos da cópia de teste: ver `modelos-padrao.json` publicado nela.)
- [ ] **B2.** A cópia de teste fica com `db`, `downloads`, `assets` e `sample`, **sem** Agenda Google de propósito
  (dados fictícios não devem virar eventos reais).

## C. Próximas rodadas (fase 3) — itens que vão exigir a conta de origem

- [ ] **C1.** Levantamento e "Registrar rodada" no Gestor de Projetos: combinar com o chat do Gestor antes de
  publicar no oficial (mexe em `gestor.js`).
- [ ] **C2.** "Peça ao Claude" (barra de conversa): usa `sample` com ferramentas do app; conferir custo de uso na
  conta de origem.
