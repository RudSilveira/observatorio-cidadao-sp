// Senado Federal: senadores de São Paulo em exercício.
// Fonte: https://legis.senado.leg.br/dadosabertos/docs/
import { getJSON, settle, json } from "../lib/fonte.mjs";

const URL_ATUAIS = "https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json";

const asArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);

export default async () => {
  const { data, erros } = await settle({
    senadoresSP: async () => {
      const r = await getJSON(URL_ATUAIS);
      const todos = asArray(r?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar);
      const sp = todos
        .map((p) => p?.IdentificacaoParlamentar || {})
        .filter((p) => p.UfParlamentar === "SP")
        .map((p) => ({
          codigo: p.CodigoParlamentar,
          nome: p.NomeParlamentar,
          partido: p.SiglaPartidoParlamentar,
          pagina: p.UrlPaginaParlamentar || `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${p.CodigoParlamentar}`,
        }));
      if (!sp.length) throw new Error("Senado sem senadores de SP");
      return sp;
    },
  });

  return json({ fonte: "Senado Federal · Dados Abertos", ...data, erros }, { maxAge: 6 * 3600 });
};

export const config = { path: "/api/senado" };
