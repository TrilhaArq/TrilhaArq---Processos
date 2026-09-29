# Termos do projeto — textos para o app (rascunho para revisão do Luan)

Base: contrato padrão da Trilha (cláusulas 2.1.7, 2.2.1, 2.2.9, 2.4.1, 2.4.2, 2.4.8 e 9.1).
Os campos entre chaves `{…}` são preenchidos pelo app com os dados do Cadastro e do projeto.

## Como o app gera o termo

- Botão no **fim da etapa** (não é item de checklist).
- Ao clicar, abre uma janela curta:
  - **Anotações** (opcional; aparece no Encerramento de Etapa e no Termo de Ciência);
  - no Termo de Ciência, também **"O que será antecipado"** (obrigatório);
  - botão **Gerar PDF**: sai com ou sem anotação.
- O PDF sai com o visual da Trilha (como os recibos do Financeiro), pronto para enviar e assinar.
- A geração fica gravada no **Histórico** (dia e hora, quem gerou, anotação).
- Dados que o app precisa e ainda não tem: **nº e data do contrato** (entram na Ficha do projeto).

## Cabeçalho comum (os 3 termos)

- Logo e nome: Trilha Arquitetura Brasileira
- Título do termo
- Contrato de Prestação de Serviço nº {contrato_numero}, de {contrato_data}
- CONTRATANTE: {clientes — nome e CPF/CNPJ de cada um}
- Projeto: {projeto_nome} ({projeto_codigo}) · {endereco}
- Etapa: {etapa} · início {data_inicio} · entrega {data_entrega}

## Rodapé comum

{cidade}, {data_por_extenso}

Assinatura de cada CONTRATANTE · Assinatura da Trilha Arquitetura Brasileira (CONTRATADO)

---

## 1. Termo de Encerramento de Etapa (Estudo Preliminar e Anteprojeto)

> Pelo presente termo, o(s) CONTRATANTE(s) acima identificado(s) declara(m) que recebeu(ram) o **{etapa}** do
> projeto **{projeto_nome}**, desenvolvido pela Trilha Arquitetura Brasileira conforme o contrato acima.
>
> Declara(m) que todo o conteúdo previsto para esta etapa foi apresentado, ajustado e entregue, e dá(ão) seu
> **ACEITE**, encerrando a etapa e autorizando o início do **{proxima_etapa}**, conforme a cláusula {clausula} do
> contrato.
>
> Declara(m) estar ciente(s) de que qualquer revisão desta etapa, depois de encerrada, será tratada como adicional
> de contrato, conforme a cláusula 9.1.

**Anotações para a próxima etapa** (quadro; se vazio, sai "Sem anotações")

> As anotações abaixo não reabrem a etapa encerrada. São pontos combinados para serem considerados no
> desenvolvimento da próxima etapa.
>
> {anotacoes}

Cláusulas: EP → 2.1.7 · AP → 2.2.9.

## 2. Termo de Encerramento de Projeto (Projeto Executivo)

> Pelo presente termo, o(s) CONTRATANTE(s) acima identificado(s) declara(m) que recebeu(ram) o **Projeto Executivo**
> completo do projeto **{projeto_nome}**, entregue em meio digital pela Trilha Arquitetura Brasileira em
> {data_entrega}, conforme a cláusula 2.4.8 do contrato.
>
> Declara(m) que todo o conteúdo previsto no contrato e no Plano de Projeto foi entregue, e dá(ão) seu **ACEITE**,
> encerrando o projeto e os serviços contratados.
>
> Declara(m) estar ciente(s) de que alterações no projeto a partir deste momento serão tratadas como novo serviço
> ou adicional de contrato, conforme as cláusulas 2.4.2 e 9.1, e de que a disponibilização do material aos
> executores e o seu uso em obra são de sua responsabilidade (cláusulas 2.4.5 a 2.4.7).

Sem quadro de anotações.

Marcenaria (ajuste 21, se aprovado): o termo final da arquitetura cita "projeto arquitetônico", para não encerrar
a marcenaria contratada à parte. A marcenaria usa os mesmos modelos: Encerramento de Etapa (EP Marcenaria) e
Encerramento de Projeto (Executivo Marcenaria), com o nº do contrato da marcenaria.

Nome: o contrato atual chama este termo de "Termo de **Finalização** de Projeto" (2.4.8). O novo nome já está na
lista de ajustes do contrato (MAPEAMENTO §11). Até a revisão, o PDF pode citar os dois: "Termo de Encerramento de
Projeto (Termo de Finalização de Projeto, cláusula 2.4.8)".

## 3. Termo de Ciência de Antecipação

> Pelo presente termo, o(s) CONTRATANTE(s) acima identificado(s) solicita(m) que **{o_que_antecipar}** seja
> iniciado antes do momento previsto no contrato, que tem como pré-requisito **{pre_requisito}**.
>
> Declara(m) estar ciente(s) de que:
> - a antecipação é feita a seu pedido;
> - informações ainda não definidas podem mudar e exigir que partes do projeto sejam refeitas;
> - o retrabalho causado pela antecipação será cobrado como adicional de contrato, conforme a cláusula 9.1;
> - os prazos das etapas seguintes podem ser afetados.

**Anotações** (quadro; se vazio, sai "Sem anotações")

> {anotacoes}

Observação: o contrato atual ainda não prevê a antecipação (conflita com o 3.3.3). Está na lista de ajustes do
contrato (MAPEAMENTO §11, item 3).
