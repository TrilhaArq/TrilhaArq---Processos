# Gestor de Tempo — Trilha (artefato)

Artefato: https://claude.ai/artifact/N5fGJZBumZy7dyN57w7e8o
Código-fonte: `gestor-de-tempo/index.html` + `gestor-de-tempo/logo.png` (publicado junto como arquivo `logo.png`).
Capacidades declaradas: `db` (banco de dados do artefato) e `downloads` (exportar CSV).

Para continuar o desenvolvimento em outra conversa: anexe este arquivo e o `index.html`, e peça para
republicar no **mesmo** artefato passando a URL acima como `url` (assim os dados são mantidos).

## Objetivo

Mapear tempo e custo de cada projeto para precificar com base em dados, não em estimativa.
É a base do futuro controle financeiro do escritório.

## Regras de negócio (v1)

1. **Um único app para todos.** Cada pessoa lança as próprias horas; os relatórios consolidam tudo.
2. **Pessoas:** hoje Luan e Elisa, os dois como sócios, usando a mesma conta Claude. A pessoa é escolhida
   em "Lançando como" (lembrado no navegador). Cada lançamento guarda `pessoaId`.
3. **Cada hora tem 3 campos:** Onde (projeto ou área interna) → Etapa (só para projeto) → O que foi feito
   (texto livre curto, com sugestões do que já foi digitado).
4. **Etapas de projeto (da Trilha, não do CAU):** Estudo Preliminar, Anteprojeto, Projeto Legal,
   Compatibilização, Projeto Executivo, Obra. Editáveis em Configurações.
5. **Áreas internas (não faturáveis):** Administrativo, Marketing, Comercial e captação, Capacitação. Editáveis.
6. **Tipos de projeto:** Residencial, Comercial, Interiores, Reforma, Outro. Editáveis.
7. **Cronômetro é a forma principal.** Um cronômetro por pessoa, salvo no banco (sobrevive a recarregar a
   página e aparece para os outros como "está em…"). Iniciar outra atividade com o cronômetro ligado para
   a atual e começa a nova. Menos de 1 minuto não é salvo.
8. **"Continuar de onde parou":** as 6 últimas combinações distintas da pessoa, um clique reinicia.
9. **Lançamento manual:** data, início, fim, onde, etapa, descrição. Fim menor que início = passou da meia-noite.
   Limite de 16 h por lançamento.
10. **Semana fechada:** a semana vai de segunda a domingo. Incluir, editar ou excluir lançamento de semana
    anterior exige justificativa (mínimo 5 caracteres), registrada em `ajustes` com data, pessoa, ação e
    valores anteriores. Exclusão em semana fechada é lógica (`excluido: true`); na semana atual é definitiva.
11. **Custos:**
    - custo-hora da pessoa (opcional) = quanto a hora custa ao escritório;
    - rateio = custos fixos mensais ÷ (horas produtivas por pessoa × nº de pessoas ativas); padrão 112 h;
    - custo-hora total = custo-hora da pessoa + rateio;
    - custo do lançamento = horas × custo-hora total (calculado com os valores **atuais**; mudar o
      custo-hora recalcula o histórico — ponto a evoluir).
    Sem custo-hora preenchido, o app mostra "—" e pede o dado, nunca zero.
12. **Projetos:** nome, cliente, tipo, área (m²), honorário, situação (ativo/pausado/concluído) e horas
    previstas por etapa (opcional). Card mostra horas, custo, horas/m², custo/m², margem e barras de
    previsto × realizado (âmbar a partir de 80%, vermelho acima de 100%).
13. **Relatórios** (filtro por período e pessoa): resumo, por pessoa (horas, dias, média/dia, % em projetos,
    valor a pagar), por projeto, por etapa, áreas internas, por atividade (15 mais frequentes) e
    fechamento mensal por pessoa (entrada, saída e horas por dia, total e valor a pagar = horas ×
    valor-hora de pagamento). Exportação em CSV (separador `;`, compatível com Excel em português).
14. **Identidade visual:** a mesma do gestor de tarefas — verde-sálvia #88AC67, neutros oklch levemente
    esverdeados, Comfortaa em títulos e rótulos, Work Sans no texto, cards com borda de 1px e raio de 10px,
    pills, logo preta no canto superior direito invertida no tema escuro.

## Modelo de dados

- `pessoas/{id}`: `nome`, `perfil` ("socio" | "colaborador"), `custoHora`, `valorHora`, `ativo`, `ordem`.
- `config/escritorio`: `etapas[{id,nome}]`, `areas[{id,nome}]`, `tipos[{id,nome}]`,
  `custosFixosMensais`, `horasProdutivasMes`.
- `projetos/{id}`: `nome`, `cliente`, `tipo`, `area`, `honorario`, `status`, `horasPrevistas{etapaId: h}`, `criadoEm`.
- `timers/{pessoaId}`: `pessoaId`, `tipo`, `alvoId`, `etapaId`, `descricao`, `inicio`.
- `lancamentos/{pessoaId}_{AAAA-MM}`: `pessoaId`, `mes`, `itens[]` — **um documento por pessoa por mês**
  (o banco do artefato tem limite de 5.000 documentos; assim são ~12 por pessoa por ano). Cada item:
  `id`, `pessoaId`, `tipo` ("projeto" | "area"), `alvoId`, `etapaId`, `descricao`, `inicio`, `fim` (ISO),
  `min`, `origem` ("cronometro" | "manual"), `criadoEm`, `editadoEm`, `excluido`, `ajustes[]`.

## Próximos passos previstos

- Acesso por perfil quando houver funcionários: conta Claude separada para a equipe, artefato
  compartilhado com "Pode interagir" e regras de acesso no banco (cada colaborador vê só as próprias
  horas; custos e relatórios só para sócios). Os lançamentos já guardam `pessoaId` para isso.
- Guardar o custo-hora vigente em cada lançamento, para o histórico não mudar quando o valor mudar.
- Integração com o sistema de orçamento de obra (honorários e etapas).
- Base de precificação: média de horas por etapa e por m², por tipo de projeto.
