# Modelos de contrato — análise (01/10/2026)

Os seis modelos oficiais (revisão de 30/09/2026, revisados e padronizados em outro chat) foram enviados pelo
Luan em .docx. **Os arquivos não ficam no repositório**, porque trazem CPF e dados bancários dos sócios; vão para o
app (armazenamento de arquivos do Artifact) quando o Comercial for construído. Aqui fica o que o app precisa saber.

## Os seis modelos

| Nº | Modelo | Tipo de projeto (sigla do Gestor) | Etapas | Pesos na rescisão (10.3) |
|---|---|---|---|---|
| 01 | Projeto do zero **com** aprovação | RES/COM/HOT com Projeto Legal | EP, AP, Legal, PE | EP 50 · AP 25 · PE 25 (Legal sem peso) |
| 02 | Projeto do zero **sem** aprovação | RES/COM/HOT sem Legal | EP, AP, PE (2.3 "Aprovações" diz que não há Legal) | EP 50 · AP 25 · PE 25 |
| 03 | Reforma **com** aprovação | REF/INT com Legal | Levantamento, EP, Legal, PE | EP+levantamento 50 · PE 50 |
| 04 | Reforma **sem** aprovação | REF/INT sem Legal | Levantamento, EP, PE | EP+levantamento 50 · PE 50 |
| 05 | Marcenaria **avulsa** | Cliente sem projeto de arquitetura da Trilha | Levantamento, EP marcenaria, PE marcenaria | 50 · 50 |
| 06 | Marcenaria **vinculada** | Marcenaria dentro de projeto da Trilha | Base do projeto (sem levantamento), EP e PE marcenaria | 50 · 50 |

**Escolha do modelo pelo app** (pergunta só quando houver dúvida):
1. Serviço de marcenaria? → cliente com projeto de arquitetura da Trilha = **06**; senão **05**.
2. Projeto do zero (RES/COM/HOT) ou reforma (REF/INT)?
3. Há Projeto Legal (prefeitura e/ou condomínio)? → "com" ou "sem aprovação".

## Campos (iguais nos seis; todos marcados `{assim}` e inteiros no arquivo)

| Campo | De onde o app tira |
|---|---|
| `{contrato_numero}` | nº do projeto + data do contrato DDMMAA (projeto 68 em 28/08/2025 → `68280825`) |
| `{proposta_numero}` | proposta aceita na oportunidade |
| `{tipo_edificacao}` | "uma residência", "um apartamento"… (tipo da oportunidade) |
| `{area_estimada}` | área total do programa (01–04) |
| `{projeto_endereco}`, `{imovel_matricula}` | endereço do projeto em Cadastros; matrícula opcional (sem ela, o trecho ", matrícula nº …" sai) |
| `{cliente_nome}`, `_nacionalidade`, `_estado_civil`, `_profissao`, `_cpf_cnpj`, `_rg`, `_endereco`, `_email`, `_telefone` | Cadastros (contato/cliente). Com mais de um contratante, o parágrafo se repete para cada um |
| `{escopo_descricao}` | conceito do projeto — texto "Sua demanda" da proposta |
| `{programa_necessidades}` | lista de ambientes do programa (01–04) |
| `{valor_total}`, `{valor_total_extenso}` | "Meu valor" aceito |
| `{parcela_1_valor}`, `_extenso`, `_vencimento` … `{parcela_n}` | parcelas combinadas; uma linha por parcela (o modelo traz 1ª, 2ª e "n") |
| `{cidade}`, `{contrato_data_extenso}` | local e data da assinatura |
| `{anexar_respostas_do_briefing}` | Anexo com as respostas do briefing (01–04) |
| `{ambientes_marcenaria}`, `{ambiente_k}: {moveis_k}` | 05 e 06: ambientes e a lista de móveis por ambiente (Anexo 01) |
| `{contrato_arquitetura_numero}` | 06: nº do contrato de arquitetura do mesmo projeto (Cadastros › Projetos) |

Valores por extenso e datas por extenso são gerados em código, sem IA.

**Prazos em amarelo** (Cláusula Terceira) já vêm com o padrão e podem mudar por contrato:
01 — EP 40 · ajustes 15 · revisão total 30 a 40 · AP: 20 a 30, 15, 10, 15, 10, 15 a 20 · Legal 20 · PE 40 a 60.
Reforma (03/04) — levantamento 5 · EP 30 · ajustes 15 · revisão total 20 a 30 · Legal 20 · PE 40 (+10 por rodada de
complementares). Marcenaria (05/06) — levantamento 5 (só 05) · EP 30 · ajustes 15 · revisão 20 a 30 · PE 40.

A última página de cada modelo é de **instruções de preenchimento** e é apagada antes de enviar.

## Como o app gera o contrato (recomendação)

O app **preenche o próprio .docx oficial**: troca os campos `{…}` no arquivo, repete as linhas de parcela e de
contratante, retira o destaque amarelo e apaga a página de instruções. Resultado: o contrato sai com a formatação,
o cabeçalho e o rodapé revisados, e pode ser aberto no Word/Google Docs para conferência e exportado em PDF para a
assinatura no gov.br.
- **Trocar um modelo = enviar o .docx novo** em Configurações do comercial; nada muda no código. Cada contrato
  gerado guarda a versão do modelo usada.
- A IA só redige `{escopo_descricao}` (a partir do texto da proposta) e, se necessário, ajusta a lista do
  programa; o restante é preenchido em código. As cláusulas nunca são tocadas.
- Técnica: o .docx é um pacote zip; o app usa JSZip (cdnjs) para abrir, substituir e baixar (capacidade `downloads`).
  Os 47–49 campos de cada modelo estão inteiros no XML (conferido), o que torna a troca segura.

## Divergências contrato × app (a decidir com o Luan)

Regra: o app vale; onde o contrato se sobrepõe ao app, perguntar. Em aberto em 01/10/2026:

| Tema | App | Contrato |
|---|---|---|
| Prazo do Anteprojeto | 70 dias úteis (um número) | fases em amarelo: 20–30 + 15 + 15 + 15–20, mais rodadas de compatibilização |
| Prazo do Executivo | 60 | "40 a 60" |
| Exigências do Legal | 10 dias úteis por exigência | não fixa prazo após o protocolo |
| Pesos das etapas | EP 30 · AP 30 · Legal 10 · PE 30 (% concluído) | EP 50 · AP 25 · PE 25 (rescisão) |
| Levantamento (reforma e marcenaria avulsa) | não existe no Gestor | etapa própria, 5 dias úteis |

Iguais nos dois: EP 40, Legal 20 para desenvolver e protocolar, EP marcenaria 30, Executivo marcenaria 40.
