// Câmara dos Deputados: bancada paulista em exercício e votações recentes do plenário.
// Fonte: https://dadosabertos.camara.leg.br/swagger/api.html
import { getJSON, settle, json, contarPorPartido } from "../lib/fonte.mjs";

const API = "https://dadosabertos.camara.leg.br/api/v2";
const ID_PLENARIO = 180; // órgão "PLEN" na API da Câmara

export default async () => {
  const hoje = new Date();
  const inicio = new Date(hoje.getTime() - 30 * 24 * 3600 * 1000);
  const d = (x) => x.toISOString().slice(0, 10);

  const { data, erros } = await settle({
    deputadosSP: async () => {
      const r = await getJSON(`${API}/deputados?siglaUf=SP&itens=100&ordem=ASC&ordenarPor=nome`);
      const lista = (r?.dados || []).map((x) => ({
        id: x.id,
        nome: x.nome,
        partido: x.siglaPartido,
        foto: x.urlFoto,
        pagina: `https://www.camara.leg.br/deputados/${x.id}`,
      }));
      if (!lista.length) throw new Error("Câmara sem deputados de SP");
      return { total: lista.length, partidos: contarPorPartido(lista, "partido"), lista };
    },
    votacoes: async () => {
      const r = await getJSON(
        `${API}/votacoes?idOrgao=${ID_PLENARIO}&dataInicio=${d(inicio)}&dataFim=${d(hoje)}&ordem=DESC&ordenarPor=dataHoraRegistro&itens=30`
      );
      return (r?.dados || [])
        .filter((v) => v.descricao)
        .slice(0, 15)
        .map((v) => ({
          id: v.id,
          data: v.data || String(v.dataHoraRegistro || "").slice(0, 10),
          descricao: v.descricao,
          aprovada: v.aprovacao === 1 ? true : v.aprovacao === 0 ? false : null,
          registro: `${API}/votacoes/${encodeURIComponent(v.id)}`,
        }));
    },
  });

  return json({ fonte: "Câmara dos Deputados · Dados Abertos", ...data, erros }, { maxAge: 3600 });
};

export const config = { path: "/api/camara" };
