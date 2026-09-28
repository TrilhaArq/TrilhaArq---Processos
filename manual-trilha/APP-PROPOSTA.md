# Gestor de Projetos: proposta de funcionamento (v1, para discussão)

28/09/2026. Base: `MAPEAMENTO.md` v3 e `processo-trilha.json`. Nada construído ainda.

## 1. Onde o app fica

- Módulo novo **dentro do Gestão Trilha** (mesmo link, mesmo banco). Substitui o botão "Em breve" da capa.
- Usa o que já existe: pessoas, cadastro de projetos, cronômetro do Tempo, tarefas, identidade visual.
- Aparece em dois lugares:
  - **Escritório → Gestor de Projetos:** visão de todos os projetos e o painel de cada um.
  - **Área de cada pessoa → Meu trabalho:** o que está com ela, em todos os projetos.

## 2. As telas

### 2.1 Painel geral (todos os projetos)
```
 Briefing │ Estudo Prelim. │ Anteprojeto        │ Proj. Executivo │ Encerrados
──────────┼────────────────┼────────────────────┼─────────────────┼───────────
 Casa A   │ Casa B         │ Residência C       │ Lodge D         │
 ● em dia │ ◔ aguard.      │ ● fase 2 · 60%     │ ● 45% pranchas  │
          │ cliente 8 d.u. │ + Legal: protocolo │                 │
```
- Uma coluna por etapa; um cartão por projeto.
- O cartão mostra: etapa e fase, próximo passo, situação, % de pranchas prontas e prazo restante.
- Situações: **em dia · aguardando (cliente, engenheiro, condomínio, prefeitura) há X dias · suspenso**.
- No topo, avisos: projetos parados, cliente perto dos 20 dias úteis e portões prontos para fechar.

### 2.2 Painel do projeto (abas)

| Aba | O que tem |
|---|---|
| **Visão geral** | Linha do tempo das etapas com os portões. Próximo passo. Checklist do marco zero. Prazo contratual em dias úteis, que pausa sozinho nas esperas. Horas gastas × previstas |
| **Pranchas** | O Plano de Projeto vivo: séries 100 a 1000, IDs automáticos, desenhos, responsável, situação e revisão (R00…). Adicionar, remover e reordenar recalcula os IDs |
| **Tarefas** | Ações ligadas à etapa ou a uma prancha, com responsável e prazo |
| **Registros** | Diário do projeto: reuniões (com duração, somada às horas), aceites do cliente, decisões, alterações (origem interna ou do cliente, marcando candidata a aditivo), revisões internas, rodadas de ajuste |
| **Complementares** | Uma linha por disciplina: contratado?, profissional, prazo informado, rodadas, aceite. Lista de interferências, com relatório em PDF |
| **Ficha** | Cliente, terreno, legislação, número de pavimentos e edificações, programa de necessidades, links (pasta, BIMx), modelo do projeto |
| **Termos** | Gerar e registrar: Encerramento de Etapa, Encerramento de Projeto, Ciência de Antecipação |

### 2.3 Criar projeto (assistente em 3 passos)
1. Modelo: do zero, reforma, interiores e marcenaria.
2. Pavimentos, edificações e unidades.
3. Programa de necessidades: ambientes por tipo (banheiro, cozinha, escada, piscina…).

→ O app mostra a prévia das etapas e das pranchas geradas (ex.: 3 banheiros = 3 ampliações), você ajusta e confirma.

### 2.4 Meu trabalho (área da pessoa)
- Pranchas e tarefas atribuídas, agrupadas por projeto e ordenadas por prazo.
- Botão **▶** em cada item: inicia o cronômetro do Tempo já com projeto, etapa e prancha.

### 2.5 Configurações
- Modelos editáveis: etapas, fases, prazos, séries e pranchas padrão.

## 3. Regras automáticas

- **Portões:** o Anteprojeto só abre com o termo do EP; o Executivo, com o termo do AP e o Legal aprovado. Abrir fora de ordem pede um Termo de Ciência de Antecipação.
- **Prazo:** conta dias úteis a partir do marco zero e pausa enquanto o projeto está "aguardando".
- **Cliente parado:** alerta em 15 dias úteis; em 20, sugere suspender.
- **Terceiros:** sem trava; registra o prazo informado e o tempo real da espera.
- **Rodadas:** contador por etapa (2 no EP), marcando a excedente.
- **Alterações:** depois de um termo, ou do Legal aprovado, as de origem externa ficam marcadas como candidatas a aditivo.

## 4. Princípio de uso: poucos cliques

- Mudar a situação de uma prancha = 1 toque no selo.
- Um único botão "+ Registro" para reunião, aceite, decisão, alteração ou revisão.
- Cronômetro a partir do item, sem escolher projeto e etapa de novo.
- Tudo editável, e o padrão é só o ponto de partida.

## 5. Ligações com o resto do app

- **Tempo:** alinhar as etapas do cronômetro ao processo (entra Briefing; Compatibilização vira fase 2 do Anteprojeto). Lançamentos antigos são convertidos.
- **Projetos (cadastro atual):** vira a ficha do Gestor; honorário e horas previstas continuam.
- **Tarefas pessoais:** a decidir (ver §7).
- **Futuro:** Financeiro (honorários e aditivos), app de obra (começa onde o Gestor termina), módulo comercial.

## 6. Construção em três entregas

| Entrega | Conteúdo |
|---|---|
| **1 · Núcleo** | Criar projeto pelo assistente, painel geral, painel do projeto (visão geral, pranchas, tarefas, ficha), situações e "aguardando", portões, Meu trabalho, cronômetro ligado ao item, etapas do Tempo alinhadas |
| **2 · Registros e terceiros** | Registros (reuniões, aceites, alterações, revisões, rodadas), complementares e interferências com PDF, prazo em dias úteis com pausa, alerta de suspensão, termos em PDF |
| **3 · Inteligência** | Checklists por desenho, biblioteca de padrões técnicos, Anexo 01 / índice / nomes de arquivo gerados, cronograma padrão com horas reais, horas por prancha, modelos de reforma e interiores |

## 6a. Programa de necessidades configurável (pedido do Luan, 28/09)

O programa deixa de ser uma lista de áreas e passa a ser o **cadastro técnico de cada ambiente**, com a configuração
que hoje está espalhada no briefing. O briefing vira só o formulário do cliente; a informação passa a morar no projeto.

**Três camadas**
1. **Catálogo de tipos de ambiente** (Configurações, editável): cada tipo tem setor, campos de configuração e regras
   (gera ampliação? gera bancada? área molhada?).
2. **Ambientes do projeto**: nome, tipo, setor, pavimento, quantidade, área prevista, vínculo (ex.: banho → suíte),
   configuração, observações do cliente e histórico de alterações.
3. **Diretrizes gerais do projeto** (na Ficha): uso, moradores e pets, acessibilidade, estética e materiais, relação
   com exterior, paisagismo e rua, sistema construtivo, sistemas (solar, reúso, ar, aquecimento, automação),
   forma de execução, padrão de investimento.

**Tipos e campos iniciais (tirados do briefing residencial)**
| Tipo | Campos de configuração | Gera |
|---|---|---|
| Cozinha | ilha; água quente; exaustão; equipamentos; itens da bancada (cuba, calha úmida, lixeira, triturador); integração | ampliação 500, bancada 700 |
| Jantar | lugares; aparador; cristaleira | — |
| Estar / TV / cinema | assentos; TV (polegadas) ou projetor | — |
| Dormitório / suíte / suíte master | cama; TV; closet; banheiro vinculado | — |
| Banheiro / lavabo | água quente; bancada (louça ou esculpida); cubas; sanitário (caixa acoplada ou válvula); ducha higiênica; bidê; toalheiro aquecido; chuveiro(s) e tipo; banheira | ampliação 500, bancada 700 |
| Lavanderia | tanque (tipo e quantidade); máquina (tipo e quantidade); passar roupa | ampliação 500, bancada 700 |
| Garagem | vagas por tipo; coberta; tomada para carro elétrico; armário/depósito | — |
| Espaço gourmet | ilha; água quente; mesa; sofás; TV; equipamentos; itens da bancada | ampliação 500, bancada 700 |
| Piscina | modelo; tamanho; aquecida; elementos (prainha, hidro, bar, raia, cascata, deck) | ampliação 500 |
| Escada | tipo; material | ampliação 500 |
| Outros (escritório, hall, depósito, despensa, rouparia, serviço…) | observações | — |

**O que a configuração alimenta**
- Plano de Projeto: ampliações e bancadas geradas pelos tipos.
- Totais por setor + 10% circulação + 10% paredes (como na proposta).
- Futuro: documentos da série 1000 (1003 louças e metais, 1004 equipamentos) a partir das escolhas;
  módulo comercial (áreas de referência e peso por tipo para precificar).
- Mudança de configuração depois de um termo vira registro de alteração (origem: cliente).

**Como o briefing entra no app**
- Agora: o Claude lê o briefing (PDF ou resposta do formulário) e preenche o programa pelo chat. Depois, ajuste manual no app.
- Depois: importar a planilha de respostas do Google Forms, com as perguntas ligadas aos campos do catálogo.
- Sugestão: ajustar o formulário para cada pergunta corresponder a um campo (e corrigir a pergunta da máquina de lavar).

## 7. Decisões para começar a Entrega 1

1. ~~Programa de necessidades: campos por ambiente bastam?~~ → substituído pelo programa configurável (§6a).
2. Tarefas de projeto: só no projeto e em "Meu trabalho" (recomendado) ou também na agenda pessoal?
3. Cronômetro: até a prancha (recomendado) ou até o desenho?
4. Código do projeto: qual padrão?
5. O módulo Projetos atual vira a ficha do Gestor (recomendado) ou continua separado?

## 6b. Seção Cadastros (pedido do Luan, 28/09)

- Botão **Cadastros** no Escritório: um lugar para cadastrar e consultar tudo o que é registro-base.
- **Cliente e projeto são registros separados.** Um projeto pode ter mais de um cliente (ex.: casal) e um cliente pode ter vários projetos.
- **Contatos** (uma lista, filtrável por tipo): cliente, fornecedor, mão de obra, parceiro.
  - Fornecedor, mão de obra, parceiro: tipo (ex.: engenheiro estrutural, marmoraria, eletricista), nome, contato, empresa, e-mail, CPF/CNPJ, razão social, endereço, descrição, observação.
  - Cliente: nome, contato, e-mail, CPF/CNPJ, razão social, endereço, projetos (vínculo), descrição, observação.
- **Projetos**: criados no briefing (situação "em proposta"), ligados a um ou mais clientes.
- **Obras**: ligadas a um projeto e a clientes; base para o app de obra.
- **Colaboradores**: o mesmo cadastro de pessoas que já existe (Luan, Elisa), ampliado.
- Cadastro rápido no contexto: ao criar um projeto, "+ novo cliente" sem sair da tela; o registro aparece em Cadastros.
- Complementares do projeto apontam para contatos do tipo parceiro.
- CPF, CNPJ e endereço são dados pessoais: com colaboradores, acesso só dos sócios.
- Áreas de referência iniciais: `processo-trilha.json` → `programa_necessidades` (projeto residencial de referência).

## 6c. Categorias do projeto (pedido do Luan, 28/09)

- Três categorias no cadastro do projeto, já na Entrega 1 (para os dados irem se acumulando):
  - **Padrão:** médio · médio alto · alto · luxo.
  - **Dimensão:** justo · confortável · folgado (no briefing: compacta · confortável · espaçosa).
  - **Dificuldade do terreno:** baixa · normal · difícil · muito difícil.
- A **dimensão** escolhe a área de referência de cada ambiente (catálogo com três colunas: justo, confortável, folgado).
- Padrão e dificuldade vão direcionar a precificação: regras definidas junto com o Luan na fase do módulo comercial.
- Garagem: 18 m² por vaga (confirmado).
