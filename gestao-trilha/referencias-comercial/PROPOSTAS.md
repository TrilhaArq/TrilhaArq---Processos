# Propostas comerciais — análise das referências (01/10/2026)

Material enviado pelo Luan para orientar o Gestor Comercial. Os PDFs **não ficam no repositório** (cerca de 10 MB
cada, com dados de clientes); aqui fica o que o app precisa saber deles.

| Proposta | Data | Padrão visual | Observação |
|---|---|---|---|
| Residência Gustavo (80_070826) | 07/08/2026 | **atual** | Mais completa: horas por etapa, custo da obra, marcenaria opcional |
| Residência Paula e Bruno (72_210825) | 21/08/2025 | **atual** | Inclui Projeto Legal e Administração de Obra (12%) |
| Marcenaria Paula e Bruno (76_140526) | 14/05/2026 | atual | Proposta à parte, dentro do projeto de arquitetura já contratado |
| Residência Heitor (62_210225) | 21/02/2025 | antigo | Referência de texto; sem horas nem custo da obra |

Código no nome do arquivo: `<nº da proposta>_<ddmmaa>`. O app gera o mesmo padrão.

## Estrutura da proposta de residência (padrão atual, 24–25 páginas)

Fundo grafite, blocos em verde-sálvia, logo da Trilha e número da página. O app desenha as páginas variáveis
com esse mesmo visual.

| # | Página | Tipo |
|---|---|---|
| 1 | Capa: "Proposta de serviço · Tipo: Projeto Residência · <cliente>" | **variável** (nome e tipo) |
| 2 | Trilha / Arquitetura / Brasileira; missão, visão, valores | fixa |
| 3 | Quem somos (Luan, Elisa, premiações) | fixa |
| 4 | Atuação e índice | fixa (o índice muda se páginas opcionais saem) |
| 5–8 | Projetos em destaque (portfólio) | fixa |
| 9 | Nosso serviço — Arquitetura | fixa |
| 10 | Projeto Arquitetônico (o que resolvemos) | fixa |
| 11 | **Sua demanda**: tipo, área estimada, endereço, texto do cliente | **variável** |
| 12–13 | **Programa de necessidades**: tabela por setor | **variável** |
| 14 | Processo de projeto e diferenciais | fixa |
| 15–17 | Etapas (Briefing, EP, AP, Legal, PE) com prazos | fixa (prazos padrão) |
| 18–19 | **Plano de projeto**: lista de desenhos por etapa | **variável** |
| 20 | **Entregáveis e horas por etapa · E o custo da obra?** | **variável** |
| 21 | Projeto de Marcenaria | opcional |
| 22 | Administração de Obra | opcional |
| 23 | **Investimento** | **variável** |
| 24 | Serviços extras | fixa |
| 25 | Contatos | fixa |

São cerca de 14 páginas fixas e 6 variáveis. As fixas entram no app como imagens (exportadas do Canva ou, para
começar, recortadas destes PDFs); trocar o design = trocar as imagens.

## O que cada página variável contém

**Sua demanda** — tipo do projeto, área estimada (m²), endereço/condomínio e um texto de 250–400 palavras.

**Programa de necessidades** — tabelas por setor (Social/Lazer, Íntimo, Serviço; às vezes Lazer à parte) com
ambiente, quantidade, área unitária e total; subtotal por setor; depois **+10% circulação** e **+10% paredes e
estrutura** sobre a soma; **total da residência**. Nota fixa: "As áreas são estimativas…".
- Itens sem área (piscina natural, fogo de chão, quintal) aparecem com "x".
- Um setor pode ficar **fora do total** quando é fase futura (Heitor: Lazer construído depois).
- O app calcula as somas — na proposta da Paula e Bruno há "Garagem 2 × 18 = 42" (seria 36); o cálculo
  automático evita esse tipo de erro.

**Plano de projeto** — mesma numeração do Plano do Gestor de Projetos: EP com `AP01…` (concepção, implantação,
plantas por pavimento, cortes, insolação, ventilação, visuais, perspectiva estrutural, N imagens, animação,
BIMx); AP e PE pelas séries 100 (plantas por pavimento), 200 cortes, 300 fachadas, 400 mapeamentos (por
pavimento), 500 ampliações (uma por área molhada/escada/piscina do programa), 600 esquadrias, 700 marmoraria e
mobiliário fixo, 800 detalhamentos, 1000 especificações, `xxx` modelos e documentos; PL com 01, 02…
**O plano sai do programa**: nº de pavimentos → plantas e mapeamentos; cada cozinha, banheiro, lavanderia,
sauna, piscina, escada → uma ampliação. O app reaproveita as séries do Gestor (`SERIES` em `gestor.js`).

**Entregáveis e horas** — quantidade por etapa (ex.: EP 27, AP 28, PE 48 = 103) e **horas por etapa**
(ex.: EP 160, AP 160, PE 200 = 520 h), com notas fixas. As horas vêm do simulador.

**E o custo da obra?** — padrão e faixa (ex.: Médio Alto R$ 3.500–4.500), área, **valor base** (R$/m² escolhido ×
área) e **"banda pra cima"** (R$/m² maior × área). O R$/m² base não é o meio da faixa: foi o mínimo (Gustavo,
3.500) e um valor intermediário (Paula e Bruno, 4.000). O simulador tem os dois campos.

**Investimento** — por serviço:
- etapas incluídas com ✓ (Briefing, EP, AP, Legal, PE…);
- **valor de tabela riscado → valor final** (ex.: ~~R$ 28.860~~ → R$ 25.480), cada um com **% do custo da obra**
  (2,13% → 1,88%). É exatamente o "Meu valor" do simulador;
- pagamento: **entrada + N parcelas** (ex.: R$ 2.480 + 14 × R$ 1.643); "outras formas podem ser combinadas";
  "para emissão de nota fiscal considerar acréscimo de 17%";
- incluso: RRT; não incluso: plotagens e impressões (e taxas de aprovação, na mais antiga);
- serviços opcionais na mesma página: Marcenaria (valor fixo, "pagamento a combinar") ou Administração de Obra
  (**12%**, "pagamento a combinar");
- "Proposta válida por 30 dias".

## Proposta de marcenaria (19 páginas)

Mesmas páginas fixas, com "Nosso serviço — Marcenaria". Variáveis:
- **Sua demanda**: endereço e a **lista de móveis por pavimento** (MOB01 Chapelaria … MOB20 Roupeiro);
- **Mapeamento de marcenaria**: planta de cada pavimento com os móveis marcados — **imagem enviada pelo
  arquiteto** (página variável com imagem);
- Nosso serviço em fases (modelos básicos → EP por ambiente → PE após o Executivo da residência);
- **Bônus** opcional (estudos e simulação de iluminação);
- Etapas: Briefing, EP (até 30 dias úteis), PE (40 dias úteis), Pré-obra e orçamento;
- Administração de Marcenaria (percentual, à parte);
- Investimento: ~~R$ 16.800~~ → R$ 12.000 + bônus; entrada + 5 parcelas de R$ 2.000,
  **"pagamento iniciando após a finalização do pagamento do Projeto Arquitetônico"**.

## Jeito Trilha de escrever (texto "Sua demanda")

Base inicial do estilo, a partir das três propostas:
- 3ª pessoa, sobre a casa e o desejo ("Residência para moradia…", "O desejo é…", "Deve explorar…").
- Ordem: uso e lugar → desejo estético (contemporâneo, pavilhão, minimalista, rústico × moderno) → terreno,
  topografia e vista → materiais e sistema construtivo → **ambiente protagonista** (a cozinha nas três) e a
  relação com o exterior → sensação esperada → síntese ("A demanda consiste em…").
- Palavras recorrentes: conexão com a paisagem, aconchego, amplitude, natureza, insolação e ventilação,
  exclusiva, contemporânea, brasileira/mineira, viver bem.
- Fecho com imagem própria quando cabe ("Uma cabana pavilhão mineira no 'arto' do morro").
- Restrições práticas entram no texto (liquidez futura, financiamento da Caixa, obra em fases).

## Decisões para o módulo

1. Modelo de proposta = sequência de páginas fixas (imagens) e variáveis (desenhadas pelo app), com páginas
   opcionais ligadas por proposta (Marcenaria, Administração de Obra, Bônus). Índice gerado pela sequência.
2. Os valores que aparecem na proposta e mudam pouco ficam em Configurações do comercial: acréscimo de NF (17%),
   validade (30 dias), percentual de Administração de Obra (12%), textos de "incluso / não incluso".
3. Prazos na proposta: **valem os do app** (`config/escritorio.prazosPadrao`), não os textos das propostas antigas
   (decisão de 01/10/2026).
4. Enquanto o Canva não for exportado, as páginas fixas podem ser recortadas da proposta do Gustavo (padrão atual).
