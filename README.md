# Observatório Cidadão SP

Painel apartidário para acompanhar a gestão pública do Brasil, do Estado de São Paulo e da cidade de São Paulo, com dados de fontes oficiais.

## Como funciona

```
public/index.html          página do portal (dados de referência de 04/11/2026 embutidos)
netlify/functions/
  indicadores.mjs  → /api/indicadores   IPCA, Selic, desemprego (Banco Central) e população (IBGE)
  camara.mjs       → /api/camara        deputados federais de SP em exercício e votações do plenário
  senado.mjs       → /api/senado        senadores de SP em exercício
netlify/lib/fonte.mjs      consulta com tempo limite, cache e tratamento de erros
netlify.toml               configuração do Netlify
```

- A página abre com os dados de referência e, em seguida, consulta `/api/*`. O que responder é atualizado e ganha o selo **ao vivo**.
- Se uma fonte oficial falhar, aquele bloco continua com o dado de referência, e o resto da página funciona normalmente.
- As respostas ficam em cache na CDN da Netlify: 1 hora para a Câmara e 6 horas para indicadores e Senado. Se a fonte cair, o último dado bom continua sendo servido por até 24 horas.

## Publicar

### Opção A: arrastar e soltar não serve
O Netlify Drop publica só arquivos estáticos e ignora as funções. Use a opção B ou C.

### Opção B: GitHub + Netlify (recomendado, atualiza a cada commit)
1. Crie um repositório no GitHub e envie esta pasta.
2. No Netlify: **Add new project → Import an existing project → GitHub** e escolha o repositório.
3. Build command: deixe em branco. Publish directory: `public` (já vem do `netlify.toml`).
4. **Deploy**. Pronto.

### Opção C: Netlify CLI, direto do seu computador
```bash
cd observatorio-netlify
npx netlify-cli login
npx netlify-cli deploy --prod
```
Na primeira vez, escolha **Create & configure a new project** e dê um nome (ex.: `observatorio-cidadao-sp`).

## Testar localmente
```bash
npx netlify-cli dev
```
Abre em http://localhost:8888 com as funções rodando.

## Atualizar os dados de referência
Os blocos de orçamento, composição da Alesp e da Câmara Municipal, executivo e projetos de lei estaduais e municipais vêm do objeto `D` em `public/index.html`. Cada item tem o link da fonte.

## Próximas integrações sugeridas
- Tesouro Nacional (SICONFI): execução orçamentária de União, Estado e Prefeitura (`apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo`).
- Cota parlamentar por deputado federal de SP (`/api/v2/deputados/{id}/despesas`), em função agendada diária para não exceder o tempo limite.
- Alesp e Câmara Municipal de SP: projetos e votações pelos portais de dados abertos de cada casa.
