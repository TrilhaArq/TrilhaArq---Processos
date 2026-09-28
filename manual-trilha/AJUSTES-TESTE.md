# Ajustes pedidos no teste do Gestor de Projetos

Link de teste: https://claude.ai/artifact/MCRcCpLbCTKURD3qUb6Wmx
Situação: **recebendo** (só anotar; processar quando o Luan liberar).

## 1. Ajuste geral: o processo mapeado precisa aparecer inteiro no app (28/09)

O app mostrou só as pranchas técnicas (séries 100 a 1000). Faltam as outras listas e as tarefas do processo,
para marcar e avançar.

1.1 **Estudo Preliminar com lista própria.** Não são pranchas: organiza-se pela apresentação (o que tem na
    apresentação e se já está feito). Nomenclatura diferente.
    *Base já disponível:* Plano de Projeto da proposta (itens "AP01…AP15": estudo de concepção, implantação,
    plantas, corte, perspectivas, estudos de insolação/ventilação/visuais, perspectiva estrutural, terraplenagem,
    imagens, animação, BIMx) e roteiro da apresentação do levantamento (capa, imagem impactante, análise do
    terreno, estudos esquemáticos, imagens, plantas e cortes, esquemas, imagens finais).
1.2 **Projeto Legal com lista própria** de desenhos para marcar. Nomenclatura diferente.
    *Base já disponível:* Plano de Projeto (01 situação/implantação, 02 cobertura, 03–05 plantas por pavimento,
    06 plantas de áreas, 07 corte longitudinal, 08 corte transversal) + passos (documentos, condomínio,
    protocolo, exigências, aprovação).
1.3 **Projeto Executivo: itens de fechamento depois da série 1000**: Guia de Projeto, imagens renderizadas
    atualizadas, BIMx, revisão das pranchas (e outros itens de entrega).
1.4 **Tarefas iniciais e de cada etapa do processo mapeado**, para marcar: ex.: após o contrato, receber o
    topográfico, documentos, abrir pasta e arquivo ArchiCAD, análise de legislação… Todas as funções mapeadas
    (entrada, etapas, fases, complementares, termos, encerramento) devem aparecer como checklist do projeto.
1.5 Se não souber organizar alguma lista, perguntar ao Luan; se souber, montar direto.

## 2. Nova etapa inicial e nomes (28/09)

2.1 **Etapa inicial própria** (antes do Estudo Preliminar), com as tarefas-base: topográfico, documentos, pasta
    padrão, arquivo ArchiCAD, dados do cliente e do terreno, análise de legislação e **modelar o terreno**.
    Terreno modelado = arquivo-base pronto para iniciar o projeto.
    Abas do quadro: [etapa inicial] · Estudo Preliminar · Anteprojeto · Projeto Legal · Projeto Executivo.
    Nome decidido: **Abertura**.
2.2 **Renomear a aba "Pranchas"**: é onde está tudo o que o projeto produz e onde se vê em que ponto ele está.
    Nome decidido: **Plano de Projeto**. Vira o mapeamento de todas as funções do projeto; as tarefas específicas o Luan avalia numa próxima rodada.

## 3. Plano de Projeto: uso e níveis (28/09)

3.1 **Adicionar item não ficou visível.** Existe um campo "+ nova prancha" no fim de cada série, mas só aparece
    com o filtro "Todas" e passa despercebido. Tornar claro onde se adiciona prancha, item ou tarefa.
3.2 **Botão de situação (A fazer → …) confuso:** avança a cada clique sem mostrar as opções. Trocar por algo que
    mostre as escolhas (ex.: menu com as situações).
3.3 **Subitens: cada prancha/tarefa-mãe abre os seus desenhos** (ex.: clicar na 801 e ver os desenhos, quadros e
    informações que ela contém). Cada desenho tem uma caixinha de concluído, e a prancha mostra o progresso
    (ex.: 1 de 4 desenhos prontos, com barrinha).
3.4 **Cronômetro continua na prancha** (tarefa-mãe); desenhos não são cronometrados.
3.5 **Checklist dentro de cada desenho:** o desenho também abre e mostra o seu checklist.
3.6 **Procedimento do desenho:** lugar para anexar/abrir o PDF-guia com o processo específico daquele desenho
    (padrões e checklists por desenho, previstos no mapeamento).

## 4. Plano de Projeto: cronômetro e prazo nos itens (28/09)

4.1 **Controles do cronômetro em cada item do Plano de Projeto:** iniciar, pausar e concluir, direto na tarefa em
    execução. Hoje o ▶ só existe na aba "Projetos" da área da pessoa (Meu trabalho), porque o cronômetro é
    de cada pessoa. **Decidido:** o cronômetro é sempre de quem está usando o app (área da pessoa), como hoje.
4.2 **Prazo (data) em cada item/tarefa do Plano de Projeto**, além do responsável, para organizar quando cada
    coisa precisa acontecer.

## 5. Cronômetro: pausar pelo item e escolher a tarefa no Tempo (28/09)

5.1 **Pausar pelo mesmo botão:** no Meu trabalho, o item em andamento ("● Em andamento") deve permitir pausar
    com um clique (play ↔ pausa no mesmo botão). Hoje só inicia. Opinião do Claude: concordo; o botão alterna
    Iniciar / Pausar, e "Concluir" fica ao lado (conclui a atividade e marca o item como pronto?) — confirmar.
5.2 **Escolher a tarefa do projeto no próprio cronômetro (aba Tempo):** ao escolher Projeto → Casa Menezes →
    Anteprojeto, mostrar a lista de itens do Plano de Projeto daquele projeto/etapa para selecionar com
    facilidade, e ligar o cronômetro ao item.
5.3 **Continuar podendo escrever uma tarefa livre**, nova, quando não estiver na lista.

## 6. Cartões do painel geral e Visão geral do projeto: prazo e progresso (28/09)

Vale para os cartões da página principal do Gestor e para a Visão geral de cada projeto.

6.1 **Manter** os números atuais: pranchas, prazo em dias úteis restantes e horas trabalhadas.
6.2 **Data final do prazo:** calcular a data-limite (dias úteis, pulando fins de semana) e mostrar a data.
6.3 **Barra horizontal de prazo** na linha de baixo, ao lado/abaixo da data: vai se enchendo conforme o prazo
    passa; cheia = prazo esgotado. Cor conforme o tempo consumido:
    - verde: até 30% do prazo;
    - amarela: de 30% a 60%;
    - vermelha: nos últimos 40% (acima de 60%).
6.4 **Barra vertical de progresso do projeto** na lateral esquerda do cartão, subindo conforme o projeto é
    concluído, com a porcentagem escrita dentro.

**Decidido (28/09):**
- Data e barra de prazo = **etapa atual**. Data em formato de data (ex.: 02/10/2026).
- Em espera por alguém de fora da Trilha (cliente, engenheiro, condomínio, prefeitura), o prazo pausa: a data
  final vai sendo empurrada e a barra fica parada até o prazo voltar a correr.
- % do projeto = itens concluídos no Plano de Projeto, do projeto todo (leitura: cada item com o mesmo peso).

6.5 **Na Visão geral do projeto aberto:**
    - a barra de conclusão total fica **horizontal**, entre os botões (Visão geral, Plano de Projeto, Tarefas…)
      e os quadros das etapas (Briefing, Estudo Preliminar, Anteprojeto…), com a mesma largura dos quadros;
    - na linha de números (prazo da etapa, pranchas, horas no projeto), incluir a **data final**;
    - logo abaixo desses quadros, a **barra de prazo** que muda de cor (verde / amarela / vermelha).
