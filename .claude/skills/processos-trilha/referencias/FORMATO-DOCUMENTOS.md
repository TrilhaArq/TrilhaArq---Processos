# Formato dos documentos de processo (PDF)

Os três documentos de 28/09/2026 estão em `../documentos/` (PDF pronto) e `../documentos/fonte/` (fonte HTML).

| Documento | Público | Conteúdo | Fonte |
|---|---|---|---|
| Mapeamento do Processo de Projeto (v1) | Luan (sócios) | processo completo com administrativo, contrato, dinheiro, dores, falhas, sugestões, pendências e pauta de revisão do contrato | `mapeamento.html` |
| Manual do Processo de Projeto (v1) | equipe (arquitetos, colaboradores, estagiários) | formal e direto; sem administrativo nem contrato; só como as coisas acontecem, etapa por etapa, com regras e passos | `manual.html` |
| O caminho do seu projeto | cliente | guia visual das etapas ligadas por setas, prazos e o que faz o projeto fluir; reduzir a ansiedade. Não confundir com o Guia de Projeto (entregável do Executivo) | `caminho.html` |

Observação: a v1 do Mapeamento cita em alguns pontos o app de gestão; nas próximas versões, tirar essas partes
(o app tem chat e regras próprios) e incorporar `DECISOES-PROCESSO.md`.

## Identidade visual

- A4, margens 18 / 17 / 20 / 17 mm; rodapé com o nome do documento à esquerda e "página / total" à direita.
- Fontes: **Comfortaa** (títulos, rótulos, números) e **Work Sans** (texto), locais em `fonte/fonts/` (`local.css`).
- Cores: verde-sálvia **#88AC67** (destaque), verde escuro #5f8443, neutros levemente esverdeados (oklch, matiz 145);
  vermelho #b3593f (falha), âmbar #a57a22 (falta), azul #4f7390 (informação).
- Capa: logo (52 mm) no alto, faixa com linha verde de 3 px, título 30 pt, subtítulo, e no pé os metadados
  (público, versão, data, modelo descrito).
- Sumário em duas colunas; cada capítulo começa em página nova; título de capítulo com número em verde.
- Componentes (em `trilha-doc.css`): `lead` (parágrafo de abertura com fio verde), tabelas com cabeçalho verde-claro,
  caixas `box` (`falha`, `sug`, `falta`, `info`), etiquetas `tag`, gravidade `sev` (alta/média/baixa), cartões,
  grades de 2 e 3 colunas, `flow` (etapas ligadas por setas, com etapa paralela tracejada) e `rule` (regra em destaque,
  no Manual), passos numerados.
- Fontes das informações marcadas em cinza pequeno: [V] voz do Luan, [C] contrato, [P] proposta, [B] briefing,
  [X] print de exportação.
- Texto em português do Brasil, frases curtas, linguagem de arquiteto (não de programador).

## Como gerar o PDF

1. Editar o HTML em `fonte/` (mesma pasta de `trilha-doc.css`, `logo.png` e `fonts/`).
2. Atualizar versão e data na capa e no rótulo do rodapé em `render.js`.
3. Rodar com Playwright: `PW=$(npm root -g)/playwright node render.js` (gera os três PDFs na pasta).
4. Conferir as páginas como imagem (ex.: `pdftoppm -r 60 -png`) antes de entregar: quebras de página, tabelas
   cortadas, capa.
