/** Lógica pura da lista com visões salvas: busca, filtros, ordenação e seleção. */
export type SortDir = "asc" | "desc";
export type IndexQuery = { search: string; filters: Record<string, string>; sort: { key: string; dir: SortDir } | null };
export type IndexView = { id: string; name: string; query: IndexQuery };

export const EMPTY_QUERY: IndexQuery = { search: "", filters: {}, sort: null };

export type IndexSpec<T> = {
  /** Texto pesquisável da linha. */
  searchText: (row: T) => string;
  /** Valor de cada filtro na linha (chave do filtro para valor). */
  filterValue: Record<string, (row: T) => string>;
  /** Valor ordenável por coluna. */
  sortValue: Record<string, (row: T) => string | number>;
};

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function applyIndexQuery<T>(rows: T[], q: IndexQuery, spec: IndexSpec<T>): T[] {
  const term = fold(q.search.trim());
  let out = rows.filter((r) => {
    if (term && !fold(spec.searchText(r)).includes(term)) return false;
    for (const [k, v] of Object.entries(q.filters)) { if (v && spec.filterValue[k]?.(r) !== v) return false; }
    return true;
  });
  if (q.sort && spec.sortValue[q.sort.key]) {
    const get = spec.sortValue[q.sort.key]!; const dir = q.sort.dir === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => { const x = get(a), y = get(b); return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "pt-BR")) * dir; });
  }
  return out;
}

export const queryIsEmpty = (q: IndexQuery) => !q.search.trim() && !Object.values(q.filters).some(Boolean) && !q.sort;
export const sameQuery = (a: IndexQuery, b: IndexQuery) => JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
function normalize(q: IndexQuery) { return { s: q.search.trim(), f: Object.fromEntries(Object.entries(q.filters).filter(([, v]) => v).sort(([x], [y]) => x.localeCompare(y))), o: q.sort }; }

/** Alterna uma linha; com `shift`, seleciona o intervalo a partir da última clicada. */
export function toggleSelection(selected: Set<string>, ids: string[], id: string, opts: { shift?: boolean; last?: string | null } = {}): Set<string> {
  const next = new Set(selected);
  if (opts.shift && opts.last && ids.includes(opts.last)) {
    const [a, b] = [ids.indexOf(opts.last), ids.indexOf(id)].sort((x, y) => x - y);
    for (const i of ids.slice(a, b! + 1)) next.add(i);
    return next;
  }
  if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}

/** Reordena um item (usado por arrastar e pelos botões de teclado). */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list]; const [item] = next.splice(from, 1); next.splice(to, 0, item!); return next;
}
