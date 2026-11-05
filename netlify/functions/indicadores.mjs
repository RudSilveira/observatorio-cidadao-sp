// Indicadores econômicos e populacionais.
// Fontes: Banco Central (SGS) e IBGE (API de agregados).
import { getJSON, settle, json, brDateToISO } from "../lib/fonte.mjs";

const SGS = (codigo, n) =>
  `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/${n}?formato=json`;

// Séries do SGS usadas:
//   13522  IPCA acumulado em 12 meses (%)
//     433  IPCA variação mensal (%)
//     432  Meta da taxa Selic (% a.a.)
//   24369  Taxa de desocupação, PNAD Contínua (%), trimestre móvel
const serie = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((p) => ({ data: brDateToISO(p.data), valor: Number(String(p.valor).replace(",", ".")) }))
    .filter((p) => p.data && Number.isFinite(p.valor));

// IBGE, tabela 6579 (estimativas de população), variável 9324.
// N1 = Brasil, N3[35] = Estado de SP, N6[3550308] = município de São Paulo.
const IBGE_POP =
  "https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N1[all]|N3[35]|N6[3550308]";

export default async () => {
  const { data, erros } = await settle({
    ipca12m: async () => serie(await getJSON(SGS(13522, 13))),
    ipcaMes: async () => serie(await getJSON(SGS(433, 1))),
    selic: async () => serie(await getJSON(SGS(432, 1))),
    desemprego: async () => serie(await getJSON(SGS(24369, 13))),
    populacao: async () => {
      const r = await getJSON(IBGE_POP);
      const series = r?.[0]?.resultados?.[0]?.series || [];
      const out = {};
      for (const s of series) {
        const id = String(s?.localidade?.id);
        const [ano, valor] = Object.entries(s?.serie || {}).pop() || [];
        const v = Number(valor);
        if (!Number.isFinite(v)) continue;
        const chave = id === "1" ? "brasil" : id === "35" ? "estado" : id === "3550308" ? "cidade" : null;
        if (chave) out[chave] = { ano, valor: v };
      }
      if (!Object.keys(out).length) throw new Error("IBGE sem dados de população");
      return out;
    },
  });

  return json({ fonte: "Banco Central (SGS) e IBGE", ...data, erros }, { maxAge: 6 * 3600 });
};

export const config = { path: "/api/indicadores" };
