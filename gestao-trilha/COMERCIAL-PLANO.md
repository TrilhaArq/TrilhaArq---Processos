# Gestor Comercial — planejamento

> **Situação (02/10/2026):** v1 construída e publicada só na cópia de teste — funil, oportunidade com próximo passo,
> importação do briefing pela planilha, programa, simulador com Meu valor e "Virar projeto". Regras da v1 em
> `REGRAS.md` (seção Gestor Comercial). Próxima rodada: proposta em PDF, contrato .docx, parcelas no Financeiro,
> IA, Levantamento e "Registrar rodada" no Gestor.

Documento de direção do módulo **Gestor Comercial** do app Gestão Trilha (escrito antes da construção):
reúne o que foi combinado com o Luan nas conversas de concepção (set/2026), já ajustado às decisões do chat do
Gestor de Projetos de 01/10/2026. Quando a construção começar, seguir
`CONTRATO.md` e as regras da skill `gestao-trilha`, e mover as regras definitivas para `REGRAS.md`.

Na capa já existe o botão "Em breve" com id `comercial` ("Oportunidades, briefing e propostas"). Ao criar
`modulos/comercial.js` com esse id, o "Em breve" some sozinho. A posição na capa já está em `ORDEM_CAPA`
(`nucleo.js`): Gestor de Projetos, Gestor de obras, **Gestor Comercial**, Financeiro, Relatórios, Configurações,
Cadastros.

Futuro: área restrita a Luan e Elisa (a mesma ideia vale para Configurações e para o Histórico dos projetos).

## Princípios

1. **Simples e com poucos cliques.** Tudo acontece dentro da oportunidade; não há telas separadas de briefing,
   proposta ou contrato.
2. **Um "próximo passo" por vez.** Cada oportunidade tem um único botão principal, que muda conforme a etapa.
3. **Nada é digitado duas vezes.** Usa os dados que o app já tem: Cadastros (contatos/clientes), Ambientes
   padrão da Trilha (`gp_config/geral.ambientes`), padrão, dimensão e dificuldade do Gestor de Projetos,
   custo-hora total (núcleo), impostos, reserva e lucro do Financeiro, prazos padrão (`config/escritorio.prazosPadrao`).
4. **IA sempre como rascunho.** O que a IA gera (texto, programa, plano, preço, contrato) é revisado antes de
   sair para o cliente. A IA roda dentro do app (capacidade `sample`), com consentimento de quem usa.
5. **Visual e organizado**, com gráficos que mostram como o comercial está indo. Mesma identidade dos outros apps.
6. **Uso eficiente do Claude.** Funcionamento, precisão e qualidade garantidos pelo caminho que gasta menos uso:
   a IA só roda quando alguém clica (nunca ao abrir a tela); preço, prazos, áreas, gráficos e PDFs são calculados
   e montados em código; cada pedido à IA leva só os dados daquela oportunidade; tarefas pequenas usam o nível
   "rápido". No desenvolvimento: ler só o necessário, registrar decisões aqui, testar na cópia de teste e
   publicar uma vez por rodada.

**Regra de prevalência (Luan, 01/10/2026):** o que já está decidido e configurado no app vale (prazos, pesos,
faixas, etapas). Propostas antigas não geram divergência: seguem o app. Só os **contratos** podem divergir do app;
nesses casos, perguntar ao Luan antes de decidir.

## Fluxo da oportunidade (etapas e botão principal)

| Etapa | Botão principal | O que acontece |
|---|---|---|
| Contato | Agendar reunião ou visita | Evento na Agenda Google; o cliente entra em Cadastros como contato |
| Reunião | Enviar briefing | Copia mensagem pronta de WhatsApp com o link do formulário |
| Briefing enviado | Importar respostas | Lê as respostas do Google Forms (conector ou CSV); avisa após 5 dias sem resposta |
| Briefing recebido | ✨ Gerar proposta | IA monta texto, programa de necessidades, plano de projeto, preço e prazos |
| Proposta em revisão | Aprovar e baixar PDF | Ajustes livres; PDF no modelo de proposta escolhido |
| Proposta apresentada | Cliente vai fechar / Perdido | Perdido pede o motivo com um clique |
| Contrato | ✨ Gerar contrato → Contrato assinado | Modelo de contrato escolhido, só com os campos preenchidos; "assinado" grava `contrato{numero, data, cidade}` no projeto (Cadastros › Projetos) |
| Fechado | Virar projeto | Cria o projeto pelo caminho do próprio Gestor (ver "Integração com o Gestor") e o contrato com parcelas no Financeiro |

Abas da oportunidade: Resumo · Briefing · Programa · Proposta · Contrato · Histórico.
Cabeçalho: cliente, telefone com botão do WhatsApp, etapa, valor e o botão do próximo passo.

## Integração com o Gestor de Projetos

- O **Briefing não é etapa do Gestor**: o projeto nasce na Abertura. O briefing vive no Comercial.
- **"Virar projeto" usa a mesma montagem do "+ Novo projeto" do Gestor**, sem duplicar lógica (expor no
  `Trilha.gestor` uma função de criação que receba os dados prontos, se ainda não existir). O Gestor espera:
  - `projetos/<id>`: `nome, codigo, sigla, tipo, clienteIds, cliente, endereco, contrato, categorias{padrao, dimensao, dificuldade}`;
  - `gp/<id>`: `pavs`, `ambientes[]` com `cfg` (respostas do briefing), `diretrizes{uso, expectativas, estetica,
    relacao, sistemas, execucao}`, `descricao` (o que o cliente trouxe e o que a Trilha observou — vem do briefing
    ou do texto da proposta), `etapas.<e>.prazo` (prazos contratados, congelados na criação) e `leg{pref, cond?}`
    (se há Projeto Legal e se há condomínio).
- O projeto no Gestor tem as abas **Informações** (descrição, categorias, diretrizes do briefing, links),
  **Configurações** (datas e prazos das etapas, Projeto Legal com condomínio sim/não, tipo) e **Programa**
  (pavimentos e ambientes). Não existe mais "Ficha".
- Nome do projeto, clientes, endereço e contratos se editam **só em Cadastros › Projetos**; o Gestor só mostra.

## Briefing (entrada)

O cliente responde o formulário do Google (o app é privado e o cliente não o acessa). O briefing apresenta o
cliente, define o programa de necessidades, configura cada ambiente (cozinha e eletrodomésticos, lugares da mesa,
o que cada banheiro precisa…), trata de questões técnicas e construtivas e da expectativa financeira.
Dele o app tira, entre outros: **área estimada (m²)** e **padrão da casa** escolhido pelo cliente — base do
simulador de preço.

**O elo mais importante: Ambientes padrão da Trilha.** O briefing e o programa de necessidades usam o mesmo catálogo
do Gestor, em `gp_config/geral.ambientes`: cada ambiente tem nome, setor, área de referência e perguntas
`campos[{k, l, t, o[]}]` (sim/não, uma opção, várias, número, texto). O catálogo cresce pelo uso ("+ outra opção",
"+ outra pergunta", "Salvar no padrão da Trilha", "Criar ambiente padrão").
- **Importar respostas (decidido em 01/10):** o app não acessa o Google Forms. Três caminhos, do mais simples ao
  mais automático: (A) **copiar e colar** a resposta do cliente num quadro do app — a IA lê o texto e distribui nos
  ambientes (vale desde o primeiro dia, sem configuração); (B) importar o CSV da planilha de respostas;
  (C) ler a planilha direto pelo conector Google Drive, se for ligado na conta.
- Por a IA interpretar o texto, **o formulário atual de residência funciona como está**. Alinhar as perguntas às
  chaves `k` dos Ambientes padrão é melhoria de precisão, não pré-requisito.
- Formulários novos ou melhorados (residência revisado, comercial, reforma…) são gerados por um roteiro do Google
  (Apps Script) que o Claude escreve: colar em script.google.com e executar cria o formulário inteiro.
- Hoje só existe o formulário de **residência do zero**; é com ele que o app começa.
- Categorias já usadas no Gestor: padrão em 5 faixas (Médio R$ 3.000–3.500/m², Médio Alto R$ 3.500–4.500/m², Alto
  R$ 4.500–5.500/m², Alto R$ 5.500–7.000/m², Luxo acima de R$ 7.000/m²); dimensão (Compacta, Confortável,
  Espaçosa); dificuldade do terreno.
- Áreas de referência = dimensão Confortável (garagem 18 m²/vaga). **Área total estimada = soma dos ambientes + 20%.**
- O briefing (ou o contrato) diz se há **Projeto Legal** e se há **condomínio**: são dois projetos (condomínio
  opcional e prefeitura), cada um com trâmite e prazos próprios.

## Precificação: simulador com ajuste manual

Enquanto não houver histórico de horas suficiente, o preço é uma **simulação**: o app sugere, o arquiteto decide.

**Lógica de precificação do Luan (decidida em 01/10):** quem manda no preço é o **programa de necessidades**. Ele
gera o Plano de Projeto (desenhos e sua complexidade) e, portanto, as horas; depois **fatores** ajustam o resultado.

```
HORAS DO PROJETO = Σ horas de referência de cada ambiente do programa
                 + horas gerais (implantação, volumetria, fachadas, legal, reuniões)
HORAS AJUSTADAS  = horas do projeto × fator padrão × fator dimensão × fator terreno × fator cliente
CUSTO            = horas ajustadas × custo-hora total
PREÇO SUGERIDO   = custo ÷ (1 − impostos − reserva − lucro)
MEU VALOR        = ajuste manual no simulador
```

- **Horas de referência em cada Ambiente padrão** (`gp_config/geral.ambientes[].horas`), sugeridas no início e
  corrigidas pelo uso. **Horas gerais** do projeto ficam numa lista própria em Configurações do comercial.
- **Fatores** (editáveis em Configurações do comercial; valores iniciais para calibrar):
  - padrão — o mais importante no começo: Médio 1,0 · Médio Alto 1,15 · Alto 1,3 · Alto+ 1,5 · Luxo 1,8;
  - dimensão: Compacta 0,95 · Confortável 1,0 · Espaçosa 1,1;
  - terreno: Baixa 1,0 · Normal 1,05 · Difícil 1,15 · Muito difícil 1,3;
  - cliente (**interno, nunca aparece na proposta**; no cadastro do cliente, só para sócios): Tranquilo 0,95 ·
    Normal 1,0 · Exigente 1,15 · Indeciso 1,2. Para cliente recorrente o app mede: horas reais ÷ previstas dos
    projetos anteriores dele.
  - a lista de fatores é aberta: novos fatores podem ser mapeados depois.
- **Futuro (estrutura preparada, vazia no começo):** cada opção de configuração de um ambiente pode somar horas
  (cuba esculpida, dois chuveiros, cozinha com ilha e muitos eletrodomésticos…), no campo opcional `h` das opções
  `campos[].o[]`. Até haver horas reais, o fator padrão cumpre esse papel.

**Entradas do simulador (vêm do briefing, todas editáveis):**
- área estimada da casa (m²);
- padrão da obra, com as 5 faixas do Gestor; o custo/m² começa no meio da faixa e pode ser ajustado.

**O app calcula:**
- **custo estimado da obra** = m² × custo/m²;
- **preço pela tabela de horas** = horas estimadas (base inicial por ambiente e etapa, editável) × custo-hora
  total, com impostos, reserva e lucro do Financeiro (preço = custo ÷ (1 − impostos − reserva − lucro));
- **referência CAU** = % sobre o custo da obra (percentual configurável, ex.: 8% residencial);
- **referência de mercado** = faixa de R$/m² de projeto (configurável).

**Aba de ajuste ("Meu valor"):** campo para digitar o valor final (ex.: a tabela dá R$ 35 mil, digito R$ 28 mil).
Tudo se recalcula na hora:
- **% do projeto sobre o custo da obra** (indicador principal, em destaque);
- R$/m² de projeto;
- lucro resultante sobre o custo das horas ("com esse valor, o lucro cai de 20% para 8%");
- diferença para o preço da tabela de horas.

**Painel visual do comparativo:** uma régua com os valores lado a lado (horas, CAU, mercado, meu valor) e o % da
obra numa faixa de referência. Opção de levar para a proposta o bloco "investimento no projeto ≈ X% do custo
estimado da obra", para mostrar ao cliente.

**Prazos na proposta:** sugerir os prazos padrão de Configurações (`config/escritorio.prazosPadrao`, dias úteis):
EP 40, Anteprojeto 70, Executivo 60, EP da marcenaria 30, Executivo da marcenaria 40, Legal 20 para desenvolver e
protocolar (contrato 3.3.3) e 10 para atender cada exigência. O que for contratado vira `etapas.<e>.prazo` ao
"Virar projeto".

**Pesos das etapas** (`pesosEtapas`, também usados no % concluído do Gestor): EP 30, AP 30, Legal 10 (5 + 5 quando há
condomínio e prefeitura), Executivo 30; marcenaria 50/50; reforma e interiores 50/50. Servem para distribuir
horas e valor entre etapas.

**Aprendizado:** guardar valor calculado, valor escolhido e se fechou. O cronômetro ligado aos itens do Plano de
Projeto mede horas reais por ambiente e etapa; o app **desconta os fatores** (horas reais ÷ produto dos fatores do
projeto) para comparar com a referência e sugere: "banheiro: referência 10 h, média real 13 h em 4 projetos →
atualizar?". O sócio aceita ou não. Aos poucos o preço passa a ser feito só por horas.

## Modelos de proposta e de contrato

**Proposta — modelo híbrido (decidido em 01/10).** As propostas atuais são arquivos do Canva, que o app não edita.
- **Páginas fixas** (apresentação da Trilha, método, etapas, portfólio): exportadas do Canva como imagem/PDF e
  enviadas uma vez ao app (capacidade `assets`); entram na proposta como são.
- **Páginas variáveis** (texto do cliente, programa, plano de projeto, investimento, prazos, pagamento): desenhadas
  pelo app na identidade Trilha e preenchidas com os dados da oportunidade.
- Um modelo de proposta = **sequência de páginas** (fixas e variáveis). Trocar o visual = trocar as imagens; mudar
  a ordem ou incluir páginas = editar a sequência. Saída em PDF.
- Existe a intenção de aprimorar o design das propostas depois; a estrutura acima permite isso sem refazer o módulo.

**Texto personalizado do cliente.**
1. **Impressões do arquiteto:** ao sair da etapa Reunião, o app abre o quadro "O que você sentiu desse cliente?"
   (texto livre ou ditado: história, terreno, vista, desejos, preocupações). Também vira a `descricao` do projeto
   no Gestor.
2. **Jeito Trilha de escrever** (Configurações do comercial): 2–3 textos exemplares, tom, palavras a usar/evitar.
3. **Geração:** a IA junta briefing + impressões + estilo; o texto abre editável, com "Reescrever com esta
   orientação" (ex.: "mais curto, cite a vista para a serra") e "Guardar como exemplo".

**Contratos.** O escritório já tem o contrato padrão e derivações, organizados num documento com códigos que permite
gerar as variações. O app guarda o texto com **campos marcados** e a IA só preenche os campos.

O escritório terá **vários modelos** de cada um:
- **Propostas** personalizadas por segmento (residencial, comercial, reforma, interiores, hotelaria…), cada uma
  falando com aquele tipo de cliente.
- **Contratos** por tipo de serviço (projeto do zero, reforma, outros), em elaboração pelo escritório.

Regras:
1. Os modelos ficam cadastrados em Configurações do comercial (nome, tipos de projeto a que se aplicam, texto base
   e campos a preencher).
2. **Antes de gerar a proposta ou o contrato, o modelo precisa estar definido.** O app sugere pelo tipo de projeto
   (mesma lógica do Gestor: RES/COM/HOT = projeto do zero; REF/INT = reforma) e pela leitura do briefing; quando há
   dúvida, pergunta ("o briefing fala em reforma com ampliação: usar contrato de Reforma ou de Projeto do zero?").
   O modelo aparece antes de gerar e troca com um clique.
3. No contrato a IA **só preenche os campos** (partes, endereço, escopo, valor, parcelas, prazos); as cláusulas são
   fixas e revisadas juridicamente.

## Serviços menores (proposta e contrato simplificados)

Serviços pequenos (consultoria, layout, visita técnica, laudo, pequeno projeto…) que não pedem o processo completo.
- Oportunidade do tipo **"Serviço"**: o cliente é criado normalmente em Cadastros; o funil é o mesmo, mais curto.
- A proposta e o contrato são **simplificados (3–4 páginas)**, montados pela IA a partir do que o sócio descreve, com
  base num modelo curto cadastrado (e editável) — sem o contrato padrão completo.
- Ao fechar: contrato e parcelas no Financeiro e um projeto simples em Cadastros (fora do Gestor), para as horas
  serem lançadas no Tempo.
- Variações fora do padrão de qualquer contrato ou proposta também são pedidas pela barra "Peça ao Claude".

## "Peça ao Claude" (barra de conversa no app)

Uma barra no estilo do chat do Claude, presente na tela principal e dentro de cada oportunidade.
- **Viável** pela capacidade `sample`: a IA recebe o contexto (a oportunidade aberta, os modelos, os dados do
  escritório) e pode **acionar funções do app** — criar oportunidade, montar proposta ou contrato simplificado,
  ajustar texto, mudar valor —, sempre mostrando o resultado para confirmação antes de gravar.
- **Escolha do modelo:** três níveis — rápido, padrão e complexo — em vez de nomes de modelos.
- **Áudio:** o microfone do teclado do celular (ditado) funciona em qualquer campo do app; um botão de microfone
  próprio (reconhecimento de voz do navegador) entra se o navegador permitir dentro do Claude — testar; se não
  funcionar, fica o ditado do teclado.
- **Memória:** a IA não lembra sozinha; o app guarda a conversa de cada oportunidade no banco e a reenvia.
- **Custo:** cada pedido consome uso da conta Claude de quem está usando; na primeira vez o app pede autorização.
  Para economizar, cada pedido envia só o necessário daquela oportunidade.

## Tela principal

1. Botão **+ Nova oportunidade**.
2. **Precisa de você hoje:** briefing recebido, proposta sem resposta, proposta perto de vencer — cada um com o
   botão da ação.
3. **Funil** em colunas (no celular, lista por etapa). Card: cliente, tipo e m², valor, dias parado (âmbar →
   vermelho).
4. **Gráficos do ano** (com seletor de ano):
   - propostas enviadas × fechadas por mês (barras);
   - funil do ano: quantas oportunidades em cada etapa e a conversão;
   - valor fechado no ano × meta anual (barra de progresso);
   - origem dos clientes que fecharam.
5. Números do mês: em negociação (R$), fechados, conversão, ticket médio.

Relatórios e Configurações do comercial ficam em botões discretos.

## Relatórios

Conversão por etapa, origem dos clientes (de onde vem quem fecha), motivos de perda, tempo médio até o contrato,
custo de captação (horas lançadas no Tempo na área "Comercial e captação" ÷ projetos fechados — é para lá que as
horas de captação vão, inclusive antes de o Comercial existir), previsão de receita (propostas em aberto ×
chance de fechar) para o Financeiro, valor calculado × valor praticado.

## Extras aprovados em princípio (ajustar depois)

1. **Mensagens prontas de WhatsApp** por etapa e **botão do WhatsApp do cliente** (prioridade).
2. Follow-up automático: aviso na capa e tarefa para o responsável.
3. Validade da proposta com aviso antes de vencer.
4. Versões da proposta (v1, v2 com desconto…) com histórico.
5. Capacidade da equipe ao fechar ("o escritório fica 110% ocupado em novembro").
6. Registro de quem indicou.
7. Nova oportunidade a partir de cliente atual (marcenaria, obra, nova etapa) — ver "Marcenaria".

## Marcenaria: proposta à parte, dentro do mesmo projeto

- Contratada junto ou depois, mas fica **dentro do projeto de arquitetura**, como segunda trilha (barra, prazo,
  espera e pausa próprias). **Não vira projeto novo.**
- A oportunidade de marcenaria, ao fechar, **ativa a marcenaria no projeto existente**: contrato (nº, data e valor
  em Cadastros), prazos e a lista de móveis.
- Cada móvel da proposta entra no Plano como par vinculado — EP da marcenaria e Executivo (série 900) — cada um com
  o seu "modelo de móvel" (`gp_config/geral.modelos.mep/mex`).
- Modelo real: proposta da Paula e Bruno (140526): lista de móveis por pavimento (MOB01…MOB20), fases (modelo
  básico; EP e Executivo depois do Executivo arquitetônico; pré-obra e orçamento), bônus de iluminação, prazos
  (EP até 30 dias úteis, Executivo 40), valor (R$ 12.000) e pagamento a partir do fim do pagamento da arquitetura.
- A **Administração de Marcenaria** (percentual sobre o custo do mobiliário) é serviço à parte, candidato ao futuro
  Gestor de Obras.

## Regras técnicas para o módulo

- Limite de 256 KB por documento: **um documento por oportunidade**, sem repetir o briefing inteiro.
- Documentos chegam do banco **somente-leitura (congelados)**: copiar com `T.clone` antes de alterar; nos testes,
  congelar os dados simulados (esse erro deixou o Gestor vazio em 01/10).
- PDFs de proposta e contrato no padrão do termo e do relatório de andamento do Gestor: jsPDF do cdnjs, logo,
  rodapé, capacidade `downloads`.
- Identidade Trilha, celular e computador (390 px e 1280 px), confirmação antes de apagar, "Salvando…" → "Salvo ✓".
- A IA dentro do app exige declarar a capacidade `sample`, repetindo as existentes (`db`, `downloads`, `mcp` com
  Google Calendar).

## Coordenação entre chats

- Os chats do Gestor de Projetos e do Comercial mexem no mesmo app. **Um chat por vez publica** no link oficial;
  combinar antes quem publica naquele período.
- Antes de começar, **ler a versão publicada atual** (ela vale sobre o repositório). Em 01/10/2026 o ramo mais
  recente do repositório era `claude/adoring-fermi-ln8hvg`.
- Módulo novo é testado primeiro na cópia de teste: https://claude.ai/artifact/V9bUhPfLyowX83XUz5Zeaw

## Material de apoio

- Página visual para apresentar o app (Luan e Elisa): https://claude.ai/artifact/84BSJdugmhStKNBKKfCNND (cópia em `gestao-trilha/apresentacoes/gestor-comercial.html`). Aprovada pelo Luan como referência para o futuro guia em PDF de todo o app.

## Pendências para começar a construir

- ~~Briefing de residência~~ — duas respostas reais recebidas em 01/10 (Gustavo e Paula e Bruno); análise em
  `referencias-comercial/BRIEFING.md`. Importação recomendada: colar a linha da planilha de respostas (com os títulos) ou CSV.
- ~~Propostas de referência~~ — recebidas em 01/10 (Gustavo, Paula e Bruno residência e marcenaria, Heitor);
  análise em `referencias-comercial/PROPOSTAS.md`. Falta só exportar do Canva as páginas fixas (por ora, recortadas dos PDFs).
- ~~Textos de referência do "jeito Trilha"~~ — tirados das três propostas (ver `PROPOSTAS.md`).
- ~~Contratos~~ — seis modelos oficiais recebidos em 01/10 (revisão de 30/09/2026); análise em
  `referencias-comercial/CONTRATOS.md`. O app preenche o próprio .docx oficial.
- Percentuais de referência: CAU por tipo, faixa de mercado R$/m², meta anual (simples; definir com o Luan).
- Horas de referência iniciais por ambiente e horas gerais (sugestão do Claude, validada pelo Luan).
