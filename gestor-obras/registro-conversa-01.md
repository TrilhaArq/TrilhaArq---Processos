# Gestor de Obras — Registro da conversa 01

Data: 01/10/2026 · Participantes: Luan (Trilha Arquitetura Brasileira) e Claude
Situação: **conversa em andamento — nada foi desenvolvido ainda.** Este documento registra o que foi
discutido e decidido até aqui, para não se perder entre chats. Não é especificação final: o tema ainda vai
evoluir antes de olharmos para o aplicativo.

---

## 0. Regras de trabalho combinadas nesta conversa

1. **Nenhum app é editado ou publicado sem autorização expressa do Luan.** Nesta fase, só conversa.
2. **Análises profundas** (falhas, acertos, pontos de atenção, sugestões) são feitas **quando o Luan pedir**.
3. **Registros** como este são feitos quando o Luan autorizar.
4. Objetivos da conversa: (a) desenhar o módulo Gestor de Obras; (b) gerar documentos que mapeiem o
   processo de administração de obra da Trilha.

---

## 1. Ponto de partida — artefatos de referência lidos

| Artefato | Link | Situação |
|---|---|---|
| Orçamento de Obra — Padrão Trilha | https://claude.ai/artifact/GKknxAZAYYUucLGSSiMvCG | atualizado 17/09; 6 itens de teste |
| Orçamento Trilha — Flipping House 001 | https://claude.ai/artifact/CbswhBdYzbjBXWLBpjJYGZ | atualizado 17/09; 29 itens reais (~R$ 31 mil), 3 de mão de obra em executivo, resto em preliminar, nenhum custo real lançado |
| Orçamento de Obra — Trilha (versão anterior) | https://claude.ai/artifact/EVzZHiYPATLHBR86cX8HQe | 16/09, versão antiga |

- Os dois mais recentes têm **o mesmo código**; só muda o título e os dados de cada banco.
- O desenvolvimento desse app de orçamento foi **pausado de propósito** pelo Luan, para estruturar primeiro o
  Gestão Trilha. Por isso há coisas a aprimorar — são esperadas.
- Funcionamento atual: abas Preliminar / Executivo / Controle de Obra (etapa é propriedade de cada item);
  agrupamento por Tipo, Ambiente, Tipo de serviço, Etapa; **4 tipos de item** (Mão de obra, Mão de obra +
  insumo, Insumo, **Aluguel**); opções de comparação no preliminar; custo real e data no controle; painel com
  totais, donut, ranking, cronograma por etapa; taxa de administração; PDF A4 com capa Trilha.

### Problemas identificados no app de referência (para corrigir no módulo novo)
1. **Percentual da administração fixo em 10% no código** — precisa ser editável por obra (ex.: pediu 15%, fechou 13%).
2. **"Previsto" não fica congelado**: soma itens executivo + execução usando o valor real quando já lançado,
   então o previsto "anda" com a obra. Deve ser uma linha de base travada no aceite do executivo.
3. Não há como marcar item **fora da base** da administração (ex.: impostos).
4. Não existe **plano de pagamento** da administração (parcelas, ajuste final, renegociação).
5. Não há tratamento para **itens que surgem durante a obra** (aditivos / imprevistos).

---

## 2. Decisões de arquitetura

- O Gestor de Obras será um **módulo dentro do app Gestão Trilha** (https://claude.ai/artifact/N5fGJZBumZy7dyN57w7e8o),
  no mesmo link — o botão "Gestor de obras" já existe na capa como "Em breve".
- Desenvolvido em **arquivo(s) de módulo separados**, trabalhados em chats próprios (eficiência e economia de IA).
- Deve funcionar como **um app quase independente dentro do sistema**:
  - **só carrega quando o usuário entra nele**; o resto do app não lê obras;
  - **carrega só a obra aberta**; obras concluídas só sob demanda;
  - **interações com o resto do app são pontuais, poucas e debatidas uma a uma** antes de existirem;
  - regra proposta: **a obra lê do restante do app, mas não altera nada fora dela**; o que precisar voltar
    (horas, relatórios, financeiro) vai por canais combinados (ex.: módulo Relatórios absorve dados).
- Interações já previstas:
  - **Cadastro** → cliente e endereço da obra (a obra guarda a referência e lê ao abrir).
  - **Gestor de Projetos** → pouca coisa; o que entrar será decidido com cuidado, item a item.
  - **Relatórios** → vai absorver algumas interações (ex.: bloco de horas do Flip no fechamento mensal).
  - **Tempo** → horas do Flip; no futuro, horas por obra para medir rentabilidade.

### Banco de dados — limites e estratégia
- Limite da plataforma: **5.000 documentos por artefato** (o app inteiro divide esse limite), **256 KB por documento**.
  Não há, até onde sabemos, plano pago que aumente esse limite.
- Volume da Trilha: **3–4 obras/ano**, podendo chegar a **6–8 com o Flip**. Estimativa ~20–30 documentos por
  obra → **~150–250 documentos/ano** no Gestor de Obras. Folga de muitos anos.
- Regras: dados **agrupados por obra/mês** (nunca 1 documento por item); **fotos e arquivos fora do banco**
  (preferência: Google Drive com link salvo no app; alternativa: depósito de arquivos do artefato, 20 MB/arquivo);
  contador de uso visível em Configurações (ex.: "1.240 de 5.000").
- Se um dia faltar espaço: migrar o armazenamento para um banco externo (ex.: Supabase/Firebase) ou Google
  Drive/Planilhas — a tela continua a mesma. Não é necessário agora.

### Ciclo de vida da obra e arquivamento
1. **Ativa** — editável.
2. **Concluída** — fica no app só para consulta.
3. **Dossiê em PDF** — após um prazo a combinar, o app gera o documento final completo; Luan baixa e guarda no Drive.
4. **Removida do app** — só após confirmação de que o PDF foi salvo.
- Revisão do acúmulo de obras concluídas: **daqui a ~1 ano**, conforme o uso real.
- Sugestão aceita como ideia: **desenhar o Dossiê da Obra desde o início**, alimentado pelos relatórios ao longo da obra.

---

## 3. Flipping House — decisões da 1ª rodada

**Lugar no sistema**
- **Camada dentro do Gestor de Obras**, vinculada a uma obra do gestor marcada como "Flip" (sem obra solta).
- Usa a base comum da obra (orçamento, execução, custo real) e acrescenta o negócio: imóvel, aquisição
  (cartório, ITBI etc.), venda, prazos, investidores.
- Três partes: **Simulador** (vale a pena comprar? "se eu gastar X e vender por Y…"), **Acompanhamento**
  (resultado previsto mudando com o custo real) e **Resultado** (lucro final, rentabilidade, prazo).
- O mapeamento completo das variáveis do Flip será feito juntos, no momento certo.

**Natureza do negócio**
- Parceria: **investidores** colocam o dinheiro e cuidam de compra, venda e processos cartoriais.
  Papel de Luan e Elisa: projeto, gestão e execução da obra, entregando o apartamento pronto para venda.
- Ganho de Luan e Elisa: **participação percentual sobre o lucro final** de cada operação.
- O Flip é um **negócio paralelo à Trilha**: **não entra no caixa nem nos relatórios financeiros da Trilha**.
  Mesmo app, livros separados — separação de **tempo, custo e ganho**.

**Horas no Flip**
- Registradas no módulo Tempo, **marcadas como Flip**, valoradas pelo **custo-hora de cada pessoa**, igual às da Trilha.
- Quando o custo-hora for configurado, **as horas já lançadas (set/out…) recebem o valor** — para enxergar quanto
  valeram. **Não haverá cobrança retroativa do Flip.**
- **Fechamento mensal de cada pessoa** (módulo Relatórios): bloco Trilha (horas, valor, total a pagar, como hoje) e,
  **abaixo, só como informação**: "Flipping House: X horas — equivaleria a R$ Y". Só total, sem detalhar
  atividades, **sem somar ao valor a pagar**.
- Painel interno do Flip: horas acumuladas por operação como **aporte de Luan e Elisa em horas**
  ("nossa hora é dinheiro").
- Futuro: a Trilha (estagiários, funcionários) presta serviço ao Flip com **tabela de custo-hora Trilha → Flip**
  (custo operacional, **sem lucro embutido**; ex.: estagiário R$ 6–8/h). Gera **conta a pagar do Flip para a Trilha**,
  acertada quando o Flip receber. Cada hora guarda o custo-hora vigente no dia em que foi feita.
  Objetivo: Luan delega tarefas do Flip a custo baixo e se libera para projetos mais complexos.

**Quem vê o quê**
- **Interno (só Luan e Elisa):** painéis, horas, custos da Trilha, aporte em horas, participação.
- **Externo (investidores):** **sempre via PDF exportado**, só com o **negócio Flip** (imóvel, obra, custos,
  cronograma, resultado, gráficos). Investidores **não acessam o app**.
- Regra do sistema proposta: o relatório de investidores é montado **apenas com dados do negócio Flip** —
  não consegue puxar horas nem custos internos da Trilha, nem por engano.

---

## 4. Processo de administração de obra da Trilha (como funciona hoje)

**Natureza do serviço**
- Serviço extra, **exclusivo para clientes de projeto**: a Trilha **só executa obras que ela mesma projetou**.
- **Sem responsabilidade financeira**: a Trilha administra; **o cliente aprova e paga tudo diretamente**.
  A Trilha leva orçamentos e compras; o cliente aprova, pode pedir novos orçamentos e efetua os pagamentos.
- **Não existe preço fechado de obra.** O cliente tem uma **liberdade controlada** de configurar o custo pelas escolhas.

**Antes da obra**
- Proposta específica de administração de obra (além do que aparece na proposta de projeto).
- **Contrato específico** — documento muito importante pelo nível de responsabilidade assumido.

**As 3 etapas do orçamento**
1. **Preliminar** — 2 a 3 orçamentos/opções por item (mão de obra e insumos). Luan e cliente decidem juntos,
   pesando **custo e qualidade** (o mais barato nem sempre é o melhor).
2. **Executivo** — escolhas fechadas: **orçamento oficial e direção da obra**, com aceite do cliente.
   Nunca é 100% preciso, mas busca mapear o máximo de custos.
3. **Controle de obra** — registro do custo real (ex.: cimento previsto R$ 35, pago R$ 37; adicional de mão de
   obra; promoção que reduziu custo). O cliente acompanha as variações e o porquê, em reuniões.
   Gráficos e relatórios para o cliente serão combinados depois.

**Remuneração da Trilha**
- **Percentual negociado por obra** (editável) sobre o custo global da obra.
- **Entra na base:** mão de obra, insumos, mão de obra + insumo, aluguel.
- **Fica fora:** a própria remuneração da Trilha e impostos (lista completa a definir).
- Previsto calculado sobre o **executivo**, congelado, com **plano de pagamento negociado**:
  - mensal fixo durante a obra (ex.: 4 meses → 4 parcelas); ou
  - por etapas concluídas (percentual por etapa); ou
  - parcelado em N vezes, independente da duração (ex.: 8 × R$ 2.500).
- **Ajuste final na última parcela**, sobre o custo real final. O saldo final também pode ser **renegociado/parcelado**
  (ex.: R$ 10 mil em 2 vezes). Postura do Luan: **negociação aberta e colaborativa**, para o cliente perceber valor
  e voltar a contratar.

### 4.1 Modelo de remuneração DECIDIDO: por origem do aumento
- **O valor do executivo é o piso**: se a obra custar menos, a remuneração **não cai**
  (economizar dá mais trabalho e não pode reduzir o ganho; mostra que a Trilha não tem interesse em encarecer a obra).
- O aumento é tratado pela **causa**:

| Origem do aumento | Incide remuneração? |
|---|---|
| **Aditivo do cliente** — item novo, mudança de escopo, troca por opção superior, decisão dele | **Sim** (mais trabalho, aprovado por ele) |
| **Variação de preço/quantidade** de itens já previstos no executivo | **Não** |
| **Imprevisto de obra** (ex.: infiltração descoberta ao abrir parede) | **Sim** (decidido em 02/10 — responsabilidade do dono da obra) |

- **Remuneração final = % × (executivo + aditivos aprovados [+ imprevistos, se acordado])**, nunca abaixo do executivo.
- **Bonificação por economia**: ideia guardada para o futuro (ex.: 10% do economizado); hoje considerada complexa.
- No app: cada item terá **origem** (Executivo / Aditivo do cliente / Imprevisto); aditivo guarda **data e forma do aceite**.
  Quadro da remuneração: executivo (piso) + aditivos aprovados = remuneração atual; variação de preço dos itens
  previstos aparece à parte, como informação.
- Conta do cliente sempre clara: remuneração prevista · apurada até agora · já paga · saldo a receber.
  Histórico de todas as renegociações do plano de pagamento.

### 4.2 ARGUMENTO COMERCIAL (registrar no mapeamento do processo)
> **"Meu valor só muda quando você aprova algo novo."**
> - Minha remuneração é travada no orçamento executivo. Se eu economizar na sua obra, meu valor não cai — eu não
>   tenho nenhum interesse em encarecer a sua obra.
> - Variação de preço dos itens já previstos não altera o que eu recebo. Se o cimento sobe, eu não ganho com isso.
> - Só incidem na minha remuneração os aditivos aprovados por você (itens novos, mudanças de escopo, trocas por
>   opções superiores) e os imprevistos de obra combinados em contrato — porque geram trabalho a mais.
> - **Quem decide o que aumenta o meu valor é sempre você.**

---

## 5. Análise do processo de obra (feita a pedido do Luan) — resumo

### Pontos de acerto
1. Cliente paga direto: sem risco de caixa, sem imposto sobre dinheiro que não é da Trilha, transparência total.
2. Preliminar com opções torna o cliente **corresponsável** pelas escolhas.
3. Executivo como linha de base com aceite.
4. Remuneração por origem do aumento (interesses alinhados).
5. Só executar projetos próprios: coerência projeto–obra, diferencial frente a construtoras.
6. Postura negociadora e colaborativa (fideliza) — precisa estar sempre **registrada**.

### Falhas e riscos
1. **(Alto) Responsabilidade técnica não definida** — RRT de execução ou de gerenciamento/administração? Quem responde
   por solidez/segurança (Código Civil: 5 anos para quem executa)? Distinguir **administrar** de **executar** em
   contrato e no RRT. → levar ao advogado.
2. **(Alto) Mão de obra contratada direto pelo cliente** — risco de vínculo/solidariedade trabalhista se a Trilha
   dirige o trabalho; segurança (EPI, NR-18, acidentes); regularização (alvará, CNO, INSS da obra).
   Sugestão: prestadores com contrato próprio com o cliente (MEI/empresa); Trilha recomenda e fiscaliza, não contrata.
3. **(Médio-alto) Decisões sem registro formal** — aceites de preliminar→executivo, aditivos e renegociações precisam
   de registro com data (o modelo por origem depende disso).
4. **(Médio-alto) Sem regra de liberação de pagamentos aos fornecedores** — risco de pagar adiantado. Sugestões:
   pagamento vinculado a **medição**, sinais limitados, **retenção** (5–10%) até a entrega; no app,
   "liberado pela Trilha" antes de "pago pelo cliente".
5. **(Médio) Escopo da administração indefinido** — visitas/semana, presença, nº de cotações, quem compra,
   reuniões, periodicidade de relatórios.
6. **(Médio) Prazo e atraso sem tratamento** — processo forte em custo, fraco em tempo. Sugestões: **prazo de
   referência** em contrato; cláusula de extensão causada pelo cliente (adicional mensal após X meses).

### Pontos de atenção
1. Expectativa do cliente: apresentar **reserva técnica recomendada** (5–10%), do cliente, fora da base.
2. Fronteira **imprevisto × erro de orçamento** — exemplos no contrato.
3. Lista fechada do que fica **fora** e do que **entra** na base (taxas, alvarás, INSS, RRT, água/luz, frete, caçamba, limpeza, consumíveis).
4. Troca por opção mais barata após o executivo: remuneração não cai (deixar claro no contrato).
5. **Comissões de fornecedores (RT)**: declarar em contrato que a Trilha não recebe (ou, se receber, que é
   informada/revertida) — reforça o argumento comercial; ver Código de Ética do CAU.

### Sugestões
1. **Ciclo completo em 5 fases**: 0. Proposta e contrato → 1. Preliminar → 2. Executivo (linha de base, aceite,
   plano de pagamento) → 3. Execução e controle (custo real, medições, aditivos, relatórios) → 4. Encerramento
   (lista de pendências, termo de entrega/recebimento, ajuste final, garantias, manual do imóvel, dossiê).
   Serve também de roteiro para os documentos de mapeamento.
2. **Rotina fixa de relatório ao cliente** (quinzenal/mensal): previsto × real, aditivos, pagamentos liberados,
   próximos passos e decisões pendentes.
3. **Rentabilidade por obra**: cruzar horas (módulo Tempo) × remuneração — o percentual cobrado paga o tempo?
4. **Banco de fornecedores e preços** próprio, com avaliação (preço, qualidade, prazo, postura).
5. **Pós-obra estruturado**: visita de 3/6 meses e canal de assistência.

### Prioridades recomendadas
1. Responsabilidade técnica / RRT / riscos trabalhistas (contrato, advogado).
2. Escopo da administração no contrato.
3. Registro formal de aceites (app ajuda).
4. Regra de liberação de pagamentos — medição e retenção (app ajuda).
5. Prazo de referência e cronograma físico (app ajuda).

---

## 5A. Planejamento e cronograma de obra (2ª parte da conversa)

**Onde começa**
- **No preliminar**: Luan já pede a cada profissional uma **estimativa de prazo** do serviço (também usada para
  decidir quem contratar, junto com custo e qualidade). → precisa de **campo de prazo estimado** nas opções.
- **Ao fechar o executivo**: reunião longa e aprofundada com cada profissional contratado → início do planejamento de fato.

**Três camadas que evoluem**
1. **Mapa conceitual** — criação do Luan, pela experiência: sequência lógica dos serviços (o que libera o quê,
   o que corre em paralelo), tempos estimados, ideia de início e fim da obra. Levado pronto às conversas com os
   profissionais ("você entraria por volta de tal período, consegue?").
2. **Planejamento efetivo** — com o detalhamento dos profissionais (prazos reais, serviço de uma vez ou em etapas
   ao longo da obra), o mapa conceitual vira o plano real do começo ao fim.
3. **Cronograma detalhado** — chega ao **nível de dia** (no dia X o pintor, no dia Y o serralheiro), com leitura
   agregada **dia / semana / mês / obra inteira**.

**Planejamento × cronograma**: duas etapas atreladas que se alimentam nos dois sentidos. Planejamento = lógica
(serviços, ordem, dependências, paralelos); cronograma = essa lógica no calendário. Atraso no cronograma pode exigir
revisar o planejamento. Conceitos técnicos: **dependências**, **folga** e **caminho crítico**.
→ No app: cronograma montado **por dependências** (não por datas digitadas), recalculando o que vem depois quando algo
atrasa e mostrando se o atraso **consumiu folga** ou **empurrou o fim da obra**.

**Dois perfis de obra**

| | Obra comercial | Obra residencial |
|---|---|---|
| Prazo | curto e apertado (cliente paga aluguel sem faturar, ou a casa funciona durante a obra) | longo, menos pressão |
| Folga | praticamente nenhuma — quase tudo é caminho crítico | folga entre serviços (alvenaria que atrasa de sexta para terça é absorvida no mês) |
| Efeito de atraso | um dia perdido refaz o cronograma inteiro | reacomodação local |
| Granularidade | dia (às vezes turno) | semana |
| Presença do Luan | diária, intensa, às vezes o dia todo | conforme a etapa: intensa em marcações/decisões, leve em execuções longas (ex.: 1–2 visitas/semana durante um mês de alvenaria, para conferir prumo e alinhamento) |
| Retorno | rápido e lucrativo, mas exige muita dedicação concentrada | mais diluído no tempo |

- Experiência atual do Luan: principalmente **obras comerciais**, incluindo **3 obras de restaurante funcionando**
  durante a reforma; próxima obra prevista: reforma de restaurante. Ainda não executou uma residência completa.
- O app **trabalha sempre em dias**; a visualização principal muda conforme o tipo de obra.
- **Resposta à pergunta do escopo**: a periodicidade de presença do Luan **depende do tipo de obra e da etapa** e sai
  do próprio cronograma → ideia de um **plano de presença** junto ao contrato.

**Cronograma físico-financeiro / curva de desembolso (OBRIGATÓRIO no módulo)**
- Gráfico simples, de linha que sobe e desce, cruzando **custo da obra × cronograma**: mostra ao cliente **em que
  meses precisa de mais dinheiro** e quando pode ficar mais tranquilo.
- Motivo: obra **não tem investimento constante**. Há picos (estrutura, formas, revestimentos, fiação) e vales
  (ex.: alvenaria). Cliente que acha que "10 mil por mês resolve" se enforca no mês de 50 mil — Luan já viu cliente
  **parar a obra** por isso, e é algo que acontece **na maioria das obras sem planejamento**.
- Detalhe técnico combinado: **o dinheiro sai quando se paga, não quando se executa** (sinal, 40% na aprovação/60% na
  entrega, material comprado antes de ser aplicado). A curva deve cruzar **item do orçamento × serviço do cronograma
  × forma de pagamento**. Sugestão: barras mensais (picos) + linha acumulada (curva S).
- **Argumento comercial**: "Antes de começar, você sabe mês a mês quanto vai precisar ter para a obra." Também ajuda
  o cliente a se planejar e reduz o risco de obra parada.

**Pacote executivo (fechado com o cliente antes de iniciar a obra)**
- **Planejamento + cronograma + orçamento executivo + fluxo de desembolso** — tudo ainda como previsão.
- O contrato já estará assinado antes; aqui o cliente dá os **aceites assinando termos**.
- Depois: **checklist de início de obra** ("vamos botar a obra para rodar").

**Desejo do Luan: Mapa da Obra visual (fase futura)**
- Visualizar o planejamento **em desenho, não em números**: símbolos, ícones, setas, linhas, post-its, bonito,
  dinâmico e mostrável ao cliente, sem redesenhar no Canva/Illustrator a cada obra (o app **gera o desenho a partir
  dos dados**).
- Vistas imaginadas: mapa conceitual (fluxograma/diagrama de precedência, com caminho crítico destacado); linha do
  tempo (Gantt estilizado, dia/semana/mês, previsto × real); quadro da semana/dia com post-its; versão para cliente
  exportável em PDF.
- Caminho: começar pela **linha do tempo visual** (mais simples) e evoluir para o fluxograma e interações (arrastar).
- **REGRA: primeiro o app funcionando e otimizando o processo. O Mapa da Obra visual só entra quando o Luan pedir.**

---

## 5B. Obra rodando: ajustes, contratos e diário (3ª parte da conversa)

**Como lidar com mudanças durante a obra (ACEITO pelo Luan)**
- **Não duplicar**: planejamento, cronograma e orçamento existem **uma vez só** — um **plano vivo**.
- **Linha de base congelada no aceite** do pacote executivo (cronograma + orçamento + curva de desembolso):
  fotografia não editável, usada para comparar previsto × real e como base da remuneração (piso).
- **Revisões formais** para grandes mudanças (aditivo grande, mudança de escopo), com novo aceite do cliente,
  numeradas como revisão de projeto: **Rev.00, Rev.01, Rev.02…** — as anteriores ficam guardadas.
- **Registro de alterações** quase automático: ao mudar data/duração/valor, o app pergunta o motivo (opções rápidas:
  chuva, falta do profissional, material atrasado, decisão do cliente, imprevisto, ajuste de planejamento) e registra
  o quê / antes → depois / quando / motivo / **causado por** (cliente, fornecedor, Trilha, externo) / impacto.
  O "causado por" liga ao modelo de remuneração por origem e à cláusula de prazo do contrato.
- Com a obra rodando: painel da semana/dia (quem deveria estar, atrasos, liberações, **decisões pendentes do cliente**);
  **data limite de compra** (cronograma − prazo de entrega); **avanço físico** por serviço alimentando as **medições**;
  previsões atualizadas (término, custo final, desembolso dos próximos meses); alertas só no caminho crítico
  (comercial) ou quando a folga acaba (residencial).

**Orçamento — as três abas continuam (esclarecimento)**
- Preliminar / Executivo / Controle de Obra são **três formas de olhar os mesmos itens**, não três cópias
  (o app atual já funciona assim: a etapa é marcação de cada item).
- Novidade: no aceite, congela a **linha de base**; daí em diante o controle compara com ela, e item que surgir depois
  do aceite entra automaticamente como **aditivo ou imprevisto**, com motivo e "causado por".

**Contratação da mão de obra (CORRIGIDO/CONFIRMADO pelo Luan)**
- A Trilha **não tem funcionários de obra**; toda a mão de obra é contratada **por empreitada** (não por diária).
- **Quem assina os contratos com os profissionais é o CLIENTE (contratante)**, não a Trilha.
- **A Trilha também é uma prestadora contratada pelo cliente**, com a função de **administrar e gerir a obra**
  (define escopo, fiscaliza, mede, libera pagamentos; não é parte pagadora).
- Cuidado registrado: empreitada **não protege sozinha** contra vínculo trabalhista — vale a prática. Proteção:
  escopo e resultado definidos (memorial), pagamento por **medição** (não por tempo), profissional organizando
  equipe e horário dentro do prazo, preferência por prestador formalizado (MEI/empresa). Validar com advogado.
- Luan vai trazer o **modelo de contrato atual** para uma leitura geral de posicionamento (análise profunda dos
  contratos modelo será feita em outro chat específico).

**Memorial descritivo do serviço / escopo de contratação (proposta, a confirmar)**
- Gerado **dentro do módulo de obra**, com o **"Peça ao Claude"** (mesma ideia do Gestor Comercial).
- Montado a partir dos dados da obra: descrição e "incluso" do item do orçamento; projetos/pranchas de referência;
  janela no cronograma; **regras da obra** (horário, limpeza, segurança, guarda de material, convivência — crucial em
  restaurante funcionando); medição e pagamento.
- Fluxo: gerar memorial → Luan ajusta → envia ao profissional → proposta dele entra como opção no preliminar →
  escolhido, o mesmo memorial vira **anexo do contrato de empreitada** (cliente × profissional).

**Separação do Gestor Comercial (DECIDIDO pelo Luan)**
- Memoriais e contratos de obra ficam **no módulo de obra**, não no Gestor Comercial — que segue sendo o gestor
  comercial de **projetos** da Trilha como escritório de arquitetura (não complicar o outro app).
- Hoje **só o Luan** assume as funções de obra; a Elisa e futuros arquitetos/estagiários provavelmente não.
  Se necessário no futuro, a Trilha terá pessoas contratadas especificamente para obra.
- Ressalva técnica: separar telas e dados, mas **reaproveitar o "motor"** (Peça ao Claude, gerador de documentos/PDF).

**Diário de obra (Luan pediu atenção especial — Claude lidera a concepção)**
- Visto pelo Luan como chave do app: "facilitar a vida, fazer o app realmente servir".
- Princípios propostos: (1) **registro em segundos, por voz** — o Peça ao Claude organiza em presença, avanço,
  ocorrência, aditivo pendente; Luan só confirma; (2) **o diário alimenta o resto** (cronograma, registro de
  alterações, medições, relatório ao cliente); (3) **feito para celular e correria** — botões grandes, poucas telas.
- Alerta: obra com sinal fraco — prever guardar no celular e enviar depois, ou avisar claramente que não salvou.

**Sugestões a mais (a confirmar)**
- **Ponto único de falha**: só o Luan faz obra → Elisa com acesso de **visualização** ao diário e ao painel.
- Campo **"responsável pela obra"** em cada obra, já pronto para um futuro profissional de obra.

**Leitura geral do modelo de contrato de Administração de Obra (02/10/2026)** — só posicionamento; análise
profunda será feita no chat específico de contratos. Principais pontos levantados:
- Funciona: cliente decide, autoriza e paga tudo (2.1.3, 2.2.2, 2.3, 3.5, 5.1); responsabilidade pelos serviços
  contratados é do cliente (2.3); não inclui execução direta (7.2); sem responsabilidade por serviços e prazos de
  terceiros (2.2.4, 3.4, 7.3); contratado define dias/horários de presença (2.5.1); atendimento em horário comercial
  (7.4); paralisação (9.2); uso de imagem e placa (7.6–7.8); mediação (10.1).
- Ajustar: título diz "Administração **e Execução**" (contradiz 7.2); cláusula 2 e 2.4 falam em "contratação de
  pessoal", "gerenciamento de pessoal" e "responsável por todas as aquisições" (contradiz o posicionamento e aumenta
  risco trabalhista); 6.6 cita **ART** (CREA) — arquiteto emite **RRT** (CAU); parcelas 1 e 2 da cláusula 4.3 dizem
  "30% do valor preliminar total **da obra**" (deveria ser do honorário); base dos honorários é o custo final sem piso
  (4.1) — não reflete o modelo por origem do aumento; nomes dos documentos inconsistentes (Orçamento Preliminar ×
  Executivo na 9.1); cronograma "com discriminação semanal" (prever diário para obra comercial); numeração pula da
  Sétima para a Nona; texto em 1ª pessoa ("de nossa responsabilidade"); contratado em nome de pessoas físicas e
  conta de PF — rever conforme a estrutura atual da Trilha.
- Falta: definição da base de cálculo (o que entra/fica fora); aditivos e origem do aumento; piso no executivo;
  plano de pagamento flexível (anexo); tratamento de atraso causado pelo contratante (decisões, aportes); forma dos
  aceites (por escrito, inclusive meio eletrônico/app); regularização (alvará, CNO, INSS) e segurança do trabalho;
  liberação de pagamentos por medição e retenção; termo de entrega/encerramento; declaração sobre comissões (RT).

**Pagamento inicial, sinal e remuneração da fase de planejamento (02/10/2026)**
- Problema identificado: o trabalho de orçamentação e planejamento acontece **antes** de existir orçamento; sem
  pagamento, risco de o cliente levar o estudo e não fechar. **O contrato vem antes do orçamento preliminar.**
- Fluxo decidido: Proposta (percentual + estimativa da obra) → **Contrato + sinal** → Orçamento preliminar →
  Pacote executivo (honorário recalculado sobre o executivo = piso; sinal abatido; saldo no plano de pagamento) →
  obra → ajuste final por aditivos.
- **Regra do sinal (DECIDIDA)**: **1% do custo estimado da obra, com valor mínimo** (ponto de partida: R$ 2.000),
  **não reembolsável e abatido do honorário**.
  - Residencial: estimativa = área × custo/m² do padrão (ex.: 100 m² × R$ 4.500 = R$ 450 mil → sinal R$ 4.500).
  - Comercial: estimativa = **verba que o cliente pretende investir**; senão, experiência do Luan; sem base → mínimo.
  - Mínimo deve cobrir o custo das horas da fase de planejamento de uma obra pequena; calibrar com as horas reais
    registradas no módulo Tempo nas próximas obras.
- **Escala de remuneração do planejamento (DECIDIDA pelo Luan)** — percentuais do **custo da obra**:
  - assinatura: **1%** · orçamento preliminar entregue: **2%** · pacote executivo aceito: **3%**.
  - Se o cliente desistir após o preliminar, deve 2%; após o executivo, 3%. Ao pagar, recebe os documentos
    (planilha do que foi feito) e pode usá-los.
  - Fundamento: planejar/orçar exige expertise e organização diferentes da execução — pode dar tanto ou mais trabalho
    que administrar a obra planejada.
- **Sugestão do Claude (A CONFIRMAR)**: transformar a escala em **cronograma de pagamento por marco** (1% na
  assinatura; complemento até 2% na entrega do preliminar; até 3% no aceite do executivo; restante durante a obra),
  em vez de cobrar só na desistência — Trilha nunca trabalha a descoberto, não precisa cobrar "multa" de quem sai,
  é mais fácil de vender e cada pagamento corresponde a um documento entregue.
- A definir: **base do 2%** ("valor de referência" impresso no Orçamento Preliminar, ex.: soma das opções
  recomendadas); ciência de que os percentuais do planejamento independem do percentual de administração negociado
  (desconto recai sobre a fase de execução).
- **Rescisão com obra em andamento (EM DISCUSSÃO)** — proposta inicial: 3% (planejamento) + parcela de execução do
  honorário × **avanço físico medido** + compensação (hoje 9.2: próxima parcela integral). Prever também rescisão
  pela Trilha (falta de aportes ou de pagamento).

**Parâmetros editáveis (DECIDIDO)**: todos os números padrão (sinal 1%, mínimo, escala 2%/3%, percentual de
administração etc.) são **padrões editáveis por obra**, conforme a negociação e o trabalho previsto.

**Caso de referência — restaurante funcionando (contexto e argumento comercial)**
- Única obra até hoje com tempo real para planejar como deveria: **3 meses de planejamento**.
- Execução: prazo de contrato de **68 dias úteis**, entregue em **66 dias úteis**.
- Restaurante aberto de meio-dia à meia-noite, 7 dias por semana. Combinado de gestão (não contratual): **toda
  sexta-feira uma etapa entregue** para o restaurante funcionar 100% sexta, sábado e domingo.
- Lição: o planejamento teve o tamanho do tempo da obra — e foi isso que permitiu entregar antes do prazo.
- Este mapeamento também servirá de **material comercial** ("é assim que a gente faz; eu tenho um aplicativo que faz
  isso; eu te entrego tais relatórios").

**Resumo e pauta (02/10/2026)**
- Resumo estruturado em PDF: `gestor-obras/resumo-gestor-obras-01.pdf`. Luan leu e aprovou; achou a **estrutura do
  app (Parte 8) ótima** — será aprofundada depois.
- Pauta do que falta decidir, para o celular: https://claude.ai/artifact/MLeRXMwrswiyAjZfvZj1yR
  (cópia: `gestor-obras/pauta-gestor-obras.html`). Itens com código: **D1–D15** (decisões), **T1–T8** (temas não
  conversados), **S1–S8** (sugestões), e um roteiro em 6 passos. Luan responde no chat pelo código.

**Decisões da pauta — D1 a D4 (02/10/2026, DECIDIDO pelo Luan)**
- **D1** — a escala 1% → 2% → 3% é **cobrada por marco** (complementos na entrega do preliminar e no aceite do executivo).
- **D2** — base dos 2%: **valor de referência** = soma das opções recomendadas pela Trilha, impresso no Orçamento Preliminar.
- **D3** — **imprevistos de obra incidem honorário**. Patologias do imóvel e situações que não tinham como ser previstas
  são responsabilidade do **dono da obra** (proprietário ou locatário do imóvel); se geram serviço a mais, incidem.
- **D4** — base do honorário: **entram** mão de obra, insumos, mão de obra + insumo, aluguel, frete, caçamba, limpeza,
  consumíveis; **ficam fora** honorário da Trilha, impostos, taxas e alvarás, INSS da obra, RRT, consumo de água e luz.

**Decisões da pauta — D5 a D7 e situação do D8 (02/10/2026)**
- **D5 (DECIDIDO)** — reserva técnica **existe e é configurável no app**, mas é **sugerida** ao cliente, que aceita ou
  não (não é obrigatória). Sugestão 5–10%, do cliente, fora da base do honorário; o app registra se o cliente aceitou.
- **D6 (DECIDIDO)** — rescisão com obra em andamento: 3% (planejamento) + parte de execução × avanço físico medido +
  próxima parcela como compensação; prever também rescisão pela Trilha.
- **D7 (DECIDIDO)** — a Trilha **ainda não tem CNPJ**: os contratados são os arquitetos como **pessoas físicas**.
- **D8 (EM DISCUSSÃO — chat de contratos)** — hoje é emitido **RRT de execução de obra** ("fica complicado de não
  emitir"). Precisa definir como o contrato preserva a caracterização de **administração** (e não de execução).
  Pontos levantados pelo Claude: RRT de execução + contratados pessoas físicas = responsabilidade técnica pessoal dos
  arquitetos (inclusive a de solidez e segurança); verificar no CAU se uma atividade de gestão (gerenciamento,
  fiscalização ou acompanhamento de obra) atende; avaliar seguro de responsabilidade civil profissional; delimitar no
  contrato o que a Trilha responde (gestão e fiscalização) e o que é dos prestadores contratados pelo cliente.

**Decisões da pauta — D8 a D10 (02/10/2026)**
- **D8 (RESOLVIDO AQUI, segue para o chat de contratos)** — RRT de execução emitido hoje; como preservar a
  caracterização de administração será tratado no chat de contratos (pontos já anotados na análise do contrato).
- **D9 (QUASE DECIDIDO)**:
  - **CNO e INSS da obra**: **fora do escopo** da Trilha — serviço à parte, ligado à contabilidade (um profissional
    com experiência pode ajudar o cliente a economizar). Futuro possível: com a Trilha estruturada e engenheiros de
    obra, incluir esse serviço. Hoje: a Trilha **alerta e indica** (item do checklist de início).
  - **Segurança do trabalho**: responsabilidade de **cada profissional contratado**. A Trilha implanta **padrões de
    segurança próprios**: **uso de EPI obrigatório** na obra por todos os contratados — vai nas **regras da obra do
    memorial descritivo** e no **contrato de empreitada**.
  - **Alvará**: em aberto. Na prática é a Trilha quem acaba solicitando. Recomendação do Claude: tratar como serviço
    de **legalização/aprovação**, cobrado à parte (valor fixo, na proposta de projeto ou de administração), executado
    pela Trilha porque depende do projeto e do responsável técnico; taxas pagas pelo cliente; licenças do negócio
    (funcionamento, bombeiros etc.) ficam com o cliente.
- **D10 (DECIDIDO)** — escopo da administração como recomendado. **Compras**: a Trilha **cota** → passa ao cliente →
  o cliente **aprova e paga** → a Trilha **alinha a entrega com o vendedor e confere** o material na obra.
  Quem aprova e paga é sempre o cliente. (Responde boa parte do tema T3.)

**Próximo passo**: decidir o alvará (D9) e seguir para D11–D13.

---

## 6. Perguntas em aberto (Luan vai responder depois)
1. Que RRT é emitido hoje? A Trilha se posiciona como administradora ou executora?
2. Como os profissionais são contratados hoje e de quem são as responsabilidades trabalhista, de segurança e de regularização?
3. Escopo da administração: visitas, compras, reuniões, relatórios.
4. Como os aceites do cliente são registrados hoje e como são liberados os pagamentos aos fornecedores?
5. Reserva técnica: faz sentido para a Trilha?
6. Lista do que fica fora da base; definição de imprevisto × erro de orçamento; imprevisto incide remuneração?
7. (Flip, futuro) Mapeamento completo das variáveis de investimento/retorno.

---

## 7. Próximos temas da conversa
1. ~~Planejamento e cronograma de obra~~ (conversado — ver seção 5A).
2. **Gestão e controle da execução da obra.**
3. **Contratos e contratação de profissionais** (como o Luan faz hoje).
4. Depois: revisar este registro, fechar decisões e só então pensar no aplicativo e nos documentos de mapeamento.
