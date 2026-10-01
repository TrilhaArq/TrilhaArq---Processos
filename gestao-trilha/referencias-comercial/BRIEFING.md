# Briefing de residência — análise (01/10/2026)

Duas respostas reais do formulário Google "Briefing Inicial - Residêncial" enviadas pelo Luan: **Gustavo**
(julho/2026, versão atual do formulário) e **Paula e Bruno** (setembro/2025, versão anterior, sem "Profissão").
Os PDFs não ficam no repositório (dados pessoais). O formulário será revisado depois; o app não depende do texto
exato das perguntas.

## Estrutura do formulário (~110 perguntas)

1. **Identificação:** e-mail, nome, profissão, nascimento, contato, endereço do projeto, já contratou projeto antes.
2. **A casa:** uso (moradia, fim de semana, praia, venda, aluguel), metragem em faixas (até 150 … >1000 m²),
   **dimensão** (Compacta / Confortável / Espaçosa), área do terreno, **topografia** (plano, declive, aclive),
   pavimentos (térrea por necessidade/vontade, flexível), moradores e pets, acessibilidade.
3. **Expectativas** (texto livre): a casa desejada; o que espera do projeto; algo mais.
4. **Programa por setor:** ambiente mais importante; social (checkboxes + integração); íntimo (grade
   quarto/suíte/suíte master/banheiro × 1–4/mais); serviços; garagem (grade carros médios/grandes/moto/bicicleta ×
   quantidade, coberta/descoberta, tomada para carro elétrico); lazer (receber visitas, estilo, espaços,
   integrado/separado, acesso). Cada setor tem "mais informações" em texto livre.
5. **Configuração dos ambientes:** cozinha (ilha, água quente, exaustão, equipamentos, bancada); jantar (lugares,
   aparador); estar/TV (TV, assentos); dormitórios (cama, TV); banheiros (água quente, configuração, suíte master
   especial, lavabo); lavanderia (tanque, máquina, passar); espaço gourmet (ilha, água quente, lugares, sofás, TV,
   equipamentos, bancada); piscina (modelo, tamanho, aquecida, elementos); itens soltos (home office, leitura,
   fogueira, lareira, rede, hidro, banheira, adega, biblioteca).
6. **Edificação:** tempo de execução, sistema construtivo, **expressão estética** (Minimalista / Expressiva /
   Rústica-Brutalista), materiais (com imagens), relação com o exterior (1–5), paisagismo (1–5), relação com a rua.
7. **Técnico:** energia solar, reúso de chuva, ar-condicionado, aquecimento de água, automação.
8. **Obra e investimento:** quem executa, **valor disponível**, financiamento, **padrão por m²** (com o CUB do mês).

## Onde cada parte entra no app

| Briefing | App |
|---|---|
| Identificação | Cadastros (contato → cliente) |
| Dimensão, padrão escolhido, topografia | `categorias{dimensao, padrao, dificuldade}` e simulador |
| Uso, expectativas, estética, materiais, relação com exterior/rua, sistemas, quem executa | `diretrizes{uso, expectativas, estetica, relacao, sistemas, execucao}` do Gestor |
| Programa e configuração dos ambientes | Ambientes padrão da Trilha (`gp_config/geral.ambientes`) com `cfg` de cada ambiente |
| Textos livres | Leitura pela IA → texto "Sua demanda" e `descricao` do projeto |
| Valor disponível | Simulador: comparação com o custo estimado da obra |

O catálogo de Ambientes padrão do Gestor **já nasceu deste formulário** (mesmas perguntas e opções). Faltam no
catálogo e entram com área de referência sugerida: despensa, rouparia, quarto e banheiro de serviço, varanda,
biblioteca, sauna, hidromassagem, academia, sala de jogos, brinquedoteca, área de fogueira, quadras, lareira, rede.

## O que as duas respostas ensinam

1. **O padrão do cliente não é o padrão da proposta.** Gustavo marcou "Médio (R$ 3.300–3.800)" e investimento de
   R$ 500 mil; a proposta usou Médio Alto (R$ 3.500–4.500) e custo estimado de R$ 1,18 mi para 338 m². O simulador
   mostra a escolha do cliente, o arquiteto define o padrão, e o app **alerta a distância** entre o valor disponível
   e o custo estimado ("o cliente informou R$ 500 mil; a estimativa é R$ 1,18 mi — 2,4×").
2. **Faixas de padrão diferentes.** O formulário atual usa 3.300–3.800 / 3.800–4.800 / 4.800–5.800 / 5.800–7.300 /
   >7.300 (CUB jul/2026); o app usa 3.000–3.500 / 3.500–4.500 / 4.500–5.500 / 5.500–7.000 / >7.000. Pela regra de
   prevalência, **valem as do app**; alinhar o formulário na revisão.
3. **Os textos livres decidem o projeto.** Cozinha protagonista com fogão a lenha e parrilla, jantar na própria ilha,
   piscina natural, "brutalismo contemporâneo com estilo rural" (Gustavo); escritório como suíte ligado ao quintal,
   suíte canadense, SPA anexo, altar voltado para o leste (Paula e Bruno). A IA lê esses textos; as marcações sozinhas
   não bastam.
4. **Do briefing à proposta há interpretação.** O programa da proposta junta e redimensiona (Gustavo: cozinha gourmet
   + jantar 45 m², estar 35, suítes 12,5, banho master 10). O app sugere pelo catálogo e pela dimensão; o arquiteto
   ajusta na aba Programa.
5. **Falha no formulário:** em "Espaço Gourmet – equipamentos" só é possível marcar uma opção (o cliente escreveu
   isso em "Outro"). Corrigir na revisão (deve ser caixa de seleção).

## Como importar as respostas (decisão técnica)

- O PDF "Imprimir" do Forms **perde as marcações** quando lido como texto (as bolinhas e caixas não viram texto).
  Serve para leitura humana, não para importar.
- **Caminho recomendado:** ligar o formulário a uma planilha Google (Respostas › Planilha) e, no app, **colar a linha
  do cliente junto com a linha de títulos** (copiar no Sheets e colar no quadro do app) ou enviar o CSV. O app
  separa pergunta × resposta em código e só usa a IA para distribuir os textos livres e o que não casar.
- Caminho futuro: leitura direta da planilha pelo conector Google Drive.
