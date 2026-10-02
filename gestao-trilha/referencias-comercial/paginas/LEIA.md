# Páginas e marca da proposta (modelo inicial)

Recortadas da proposta do Gustavo (80_070826, padrão atual) a 120 dpi, para o modelo híbrido do Gestor Comercial:
`fixa-NN.jpg` = página NN do PDF original; `capa-fundo.jpg` = capa sem o texto; `logo-*.png` e `trilha-*.png` = logo e
assinatura (escuro para páginas claras, verde para páginas escuras).

Para levar a um artefato (oficial ou teste): enviar as imagens ao armazenamento de arquivos do artefato (Artifact
`asset: true`), trocar os `ID_<nome>` de `../modelos-template.json` pelos ids recebidos e publicar o resultado como
`modelos-padrao.json` junto com o app. Os contratos vão do mesmo jeito, em base64 dentro de um `.js` (`"<base64>";`),
gerados a partir dos .docx oficiais (que não ficam no repositório por terem CPF e dados bancários).
Contas convidadas de outra organização só conseguem enviar imagens e scripts; por isso o contrato vai como script.
O primeiro "Salvar modelos" em Configurações do comercial grava os modelos no banco (`com_config/modelos`).
Ids da cópia de teste (02/10/2026): ver o `modelos-padrao.json` publicado nela.

Arquivos prontos com os ids de cada artefato: `../modelos-padrao-oficial.json` e `../modelos-padrao-teste.json`
(inclui o modelo de proposta "Serviço menor" e o contrato 07).
