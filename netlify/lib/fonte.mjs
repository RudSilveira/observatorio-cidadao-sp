// Utilitários compartilhados pelas funções do Observatório Cidadão SP.

const UA = "ObservatorioCidadaoSP/1.0 (projeto civico sem fins lucrativos)";

// Busca JSON com tempo limite. Lança erro se a fonte não responder bem.
export async function getJSON(url, { timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json", "User-Agent": UA },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${new URL(url).host}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Executa várias consultas; uma fonte com falha não derruba as outras.
export async function settle(tasks) {
  const keys = Object.keys(tasks);
  const results = await Promise.allSettled(keys.map((k) => tasks[k]()));
  const data = {};
  const erros = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled") data[keys[i]] = r.value;
    else erros[keys[i]] = String(r.reason?.message || r.reason);
  });
  return { data, erros };
}

// Resposta JSON com cache na CDN da Netlify.
// - s-maxage: a CDN guarda por `maxAge` segundos
// - stale-while-revalidate: depois disso serve o dado antigo enquanto atualiza
// - durable: o cache é compartilhado entre todas as regiões da CDN
export function json(body, { maxAge = 3600, status = 200 } = {}) {
  return new Response(JSON.stringify({ ...body, consultadoEm: new Date().toISOString() }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Netlify-CDN-Cache-Control": `public, durable, s-maxage=${maxAge}, stale-while-revalidate=86400`,
    },
  });
}

// "dd/mm/aaaa" -> "aaaa-mm-dd"
export function brDateToISO(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || ""));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

export function contarPorPartido(lista, campo) {
  const mapa = new Map();
  for (const item of lista) {
    const p = (item[campo] || "Sem partido").trim();
    mapa.set(p, (mapa.get(p) || 0) + 1);
  }
  return [...mapa.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"));
}
