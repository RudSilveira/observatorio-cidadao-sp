// Indicadores econômicos e populacionais.
// Fonte: Banco Central (SGS).
// A população (IBGE) fica como dado de referência na página: é uma estimativa anual,
// e a API do IBGE não responde a tempo quando consultada dos servidores da Netlify, fora do Brasil.
import { getJSON, settle, json, brDateToISO } from "../lib/fonte.mjs";

// "ultimos/N" aceita no máximo 20 pontos.
const SGS = (codigo, n) =>
  `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/${n}?formato=json`;
// Consulta por intervalo de datas (dd/mm/aaaa), usada na Selic, que é diária e tem datas futuras.
// Datas no horário de Brasília (os servidores da Netlify usam UTC).
const isoSP = (d) => d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }); // aaaa-mm-dd
const brData = (d) => isoSP(d).split("-").reverse().join("/");
const SGS_PERIODO = (codigo, dias) => {
  const fim = new Date();
  const ini = new Date(fim.getTime() - dias * 24 * 3600 * 1000);
  return `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados?formato=json&dataInicial=${brData(ini)}&dataFinal=${brData(fim)}`;
};

// Séries do SGS usadas:
//   13522  IPCA acumulado em 12 meses (%)
//     433  IPCA variação mensal (%)
//     432  Meta da taxa Selic (% a.a.)  -- a série já traz datas futuras, até a próxima reunião do Copom
//   24369  Taxa de desocupação, PNAD Contínua (%), trimestre móvel
const hojeISO = () => isoSP(new Date());
const serie = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((p) => ({ data: brDateToISO(p.data), valor: Number(String(p.valor).replace(",", ".")) }))
    .filter((p) => p.data && Number.isFinite(p.valor) && p.data <= hojeISO());

export default async () => {
  const { data, erros } = await settle({
    ipca12m: async () => serie(await getJSON(SGS(13522, 13))),
    ipcaMes: async () => serie(await getJSON(SGS(433, 2))),
    selic: async () => serie(await getJSON(SGS_PERIODO(432, 15))),
    desemprego: async () => serie(await getJSON(SGS(24369, 13))),
  });

  return json({ fonte: "Banco Central (SGS)", ...data, erros }, { maxAge: 6 * 3600 });
};

export const config = { path: "/api/indicadores" };
