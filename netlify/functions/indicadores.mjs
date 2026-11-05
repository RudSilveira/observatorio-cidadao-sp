// Indicadores econômicos e populacionais.
// Fontes: Banco Central (SGS) e IBGE (API de agregados).
import { getJSON, settle, json, brDateToISO } from "../lib/fonte.mjs";

const SGS = (codigo, n) =>
  `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/${n}?formato=json`;

// Séries do SGS usadas:
//   13522  IPCA acumulado em 12 meses (%)
//     433  IPCA variação mensal (%)
//     432  Meta da taxa Selic (% a.a.)  -- a série já traz datas futuras, até a próxima reunião do Copom
//   24369  Taxa de desocupação, PNAD Contínua (%), trimestre móvel
const hojeISO = () => new Date().toISOString().slice(0, 10);
const serie = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((p) => ({ data: brDateToISO(p.data), valor: Number(String(p.valor).replace(",", ".")) }))
    .filter((p) => p.data && Number.isFinite(p.valor) && p.data <= hojeISO());

// IBGE, tabela 6579 (estimativas de população), variável 9324.
// Uma consulta por localidade: N1 = Brasil, N3 35 = Estado de SP, N6 3550308 = município de São Paulo.
const LOCAIS = { brasil: "N1[all]", estado: "N3[35]", cidade: "N6[3550308]" };
const ibgePop = (loc) =>
  `https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-6/variaveis/9324?localidades=${encodeURIComponent(loc)}`;

async function populacao() {
  const out = {};
  const falhas = [];
  await Promise.all(
    Object.entries(LOCAIS).map(async ([chave, loc]) => {
      try {
        const r = await getJSON(ibgePop(loc));
        const s = r?.[0]?.resultados?.[0]?.series?.[0]?.serie || {};
        const anos = Object.keys(s).filter((a) => Number.isFinite(Number(s[a]))).sort();
        const ano = anos.pop();
        if (ano) out[chave] = { ano, valor: Number(s[ano]) };
        else falhas.push(chave);
      } catch (e) {
        falhas.push(`${chave}: ${e.message}`);
      }
    })
  );
  if (!Object.keys(out).length) throw new Error(`IBGE sem dados de população (${falhas.join("; ")})`);
  return out;
}

export default async () => {
  const { data, erros } = await settle({
    ipca12m: async () => serie(await getJSON(SGS(13522, 13))),
    ipcaMes: async () => serie(await getJSON(SGS(433, 2))),
    selic: async () => serie(await getJSON(SGS(432, 60))),
    desemprego: async () => serie(await getJSON(SGS(24369, 13))),
    populacao,
  });

  return json({ fonte: "Banco Central (SGS) e IBGE", ...data, erros }, { maxAge: 6 * 3600 });
};

export const config = { path: "/api/indicadores" };
