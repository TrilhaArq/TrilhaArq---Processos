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

## 7. Decisões para começar a Entrega 1

1. Programa de necessidades: campos por ambiente (tipo, área, pavimento, quantidade) bastam?
2. Tarefas de projeto: só no projeto e em "Meu trabalho" (recomendado) ou também na agenda pessoal?
3. Cronômetro: até a prancha (recomendado) ou até o desenho?
4. Código do projeto: qual padrão?
5. O módulo Projetos atual vira a ficha do Gestor (recomendado) ou continua separado?
