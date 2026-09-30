# Gestor Comercial — planejamento

Documento de direção para o futuro módulo **Gestor Comercial** do app Gestão Trilha. **Ainda não é para construir**:
reúne o que foi combinado com o Luan nas conversas de concepção (set/2026). Quando a construção começar, seguir
`CONTRATO.md` e as regras da skill `gestao-trilha`, e mover as regras definitivas para `REGRAS.md`.

Na capa já existe o botão "Em breve" com id `comercial` ("Oportunidades, briefing e propostas").

## Princípios

1. **Simples e com poucos cliques.** Tudo acontece dentro da oportunidade; não há telas separadas de briefing,
   proposta ou contrato.
2. **Um "próximo passo" por vez.** Cada oportunidade tem um único botão principal, que muda conforme a etapa.
3. **Nada é digitado duas vezes.** Usa os dados que o app já tem: Cadastros (contatos/clientes), catálogo de
   ambientes, padrão, dimensão e dificuldade do Gestor de Projetos, custo-hora total (núcleo), impostos,
   reserva e lucro do Financeiro, prazos padrão das etapas.
4. **IA sempre como rascunho.** O que a IA gera (texto, programa, plano, preço, contrato) é revisado antes de
   sair para o cliente. A IA roda dentro do app (capacidade `sample`), com consentimento de quem usa.
5. **Visual e organizado**, com gráficos que mostram como o comercial está indo. Mesma identidade dos outros apps.

## Fluxo da oportunidade (etapas e botão principal)

| Etapa | Botão principal | O que acontece |
|---|---|---|
| Contato | Agendar reunião ou visita | Evento na Agenda Google; o cliente entra em Cadastros como contato |
| Reunião | Enviar briefing | Copia mensagem pronta de WhatsApp com o link do formulário |
| Briefing enviado | Importar respostas | Lê as respostas do Google Forms (conector ou CSV); avisa após 5 dias sem resposta |
| Briefing recebido | ✨ Gerar proposta | IA monta texto, programa de necessidades, plano de projeto, preço e prazos |
| Proposta em revisão | Aprovar e baixar PDF | Ajustes livres; PDF no modelo de proposta escolhido |
| Proposta apresentada | Cliente vai fechar / Perdido | Perdido pede o motivo com um clique |
| Contrato | ✨ Gerar contrato → Contrato assinado | Modelo de contrato escolhido, só com os campos preenchidos |
| Fechado | Virar projeto | Cria projeto (código, Ficha com ambientes, Plano de Projeto, horas previstas) e o contrato com parcelas no Financeiro |

Abas da oportunidade: Resumo · Briefing · Programa · Proposta · Contrato · Histórico.
Cabeçalho: cliente, telefone com botão do WhatsApp, etapa, valor e o botão do próximo passo.

## Briefing (entrada)

O cliente responde o formulário do Google (o app é privado e o cliente não o acessa). O briefing apresenta o
cliente, define o programa de necessidades, configura cada ambiente (cozinha e eletrodomésticos, lugares da mesa,
o que cada banheiro precisa…), trata de questões técnicas e construtivas e da expectativa financeira.
Dele o app tira, entre outros: **área estimada (m²)** e **padrão da casa** escolhido pelo cliente — base do
simulador de preço.

## Precificação: simulador com ajuste manual

Enquanto não houver histórico de horas suficiente, o preço é uma **simulação**: o app sugere, o arquiteto decide.

**Entradas (vêm do briefing, todas editáveis):**
- área estimada da casa (m²);
- padrão da obra, com as faixas do Gestor (Médio R$ 3.000–3.500/m², Médio Alto R$ 3.500–4.500/m², Alto
  R$ 4.500–5.500/m², Alto R$ 5.500–7.000/m², Luxo…); o custo/m² começa no meio da faixa e pode ser ajustado.

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

**Aprendizado:** guardar valor calculado, valor escolhido e se fechou. Com o tempo, o cronômetro ligado aos itens do
Plano de Projeto mede horas reais por ambiente e etapa; o app compara previsto × realizado, sugere ajustes na base
de horas e a precificação passa, aos poucos, a ser feita só por horas.

## Modelos de proposta e de contrato

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
custo de captação (horas em "Comercial e captação" ÷ projetos fechados), previsão de receita (propostas em aberto ×
chance de fechar) para o Financeiro, valor calculado × valor praticado.

## Extras aprovados em princípio (ajustar depois)

1. **Mensagens prontas de WhatsApp** por etapa e **botão do WhatsApp do cliente** (prioridade).
2. Follow-up automático: aviso na capa e tarefa para o responsável.
3. Validade da proposta com aviso antes de vencer.
4. Versões da proposta (v1, v2 com desconto…) com histórico.
5. Capacidade da equipe ao fechar ("o escritório fica 110% ocupado em novembro").
6. Registro de quem indicou.
7. Nova oportunidade a partir de cliente atual (marcenaria, obra, nova etapa).

## Pendências para começar a construir

- Formulário de briefing (link ou perguntas).
- Modelos de proposta por segmento.
- Modelos de contrato (em elaboração).
- Percentuais de referência: CAU por tipo, faixa de mercado R$/m², meta anual.
