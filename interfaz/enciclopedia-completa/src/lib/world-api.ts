export type WorldCategorySummary = {
  id: number;
  name: string;
  recordCount: number;
};

export type WorldPlanetSummary = {
  id: number;
  name: string;
  imagePath: string | null;
  favorite: boolean;
  recordCount: number;
  categories: WorldCategorySummary[];
};

export type WorldOverview = {
  mode: "local-readonly" | "supabase-readonly";
  database: string;
  planetCount: number;
  categoryCount: number;
  recordCount: number;
  planets: WorldPlanetSummary[];
};

export type CategoryPage = {
  planetId: number;
  categoryId: number;
  categoryName: string;
  titleColumn: string;
  columns: string[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  query: string;
  records: Array<Record<string, unknown>>;
};

const LOCAL_API = "http://127.0.0.1:8765";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_KEY);
const IS_PRODUCTION_BROWSER =
  typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname);

const REMOTE_CATEGORIES = [
  { id: 1, table: "creatures", name: "Criaturas", titleColumn: "common_name" },
  { id: 2, table: "plants", name: "Plantas", titleColumn: "common_name" },
  { id: 3, table: "minerals", name: "Minerales", titleColumn: "name" },
] as const;
let overviewRequest: Promise<WorldOverview> | null = null;
const pageCache = new Map<string, CategoryPage>();
const MAX_CACHED_PAGES = 24;

export async function fetchWorldOverview(signal?: AbortSignal): Promise<WorldOverview> {
  if (!overviewRequest) {
    overviewRequest = (USE_SUPABASE
      ? fetchSupabaseOverview()
      : IS_PRODUCTION_BROWSER
        ? Promise.reject(new Error("Supabase no está configurado en este despliegue"))
        : fetchLocalOverview())
      .catch((error: unknown) => {
        overviewRequest = null;
        throw error;
      });
  }
  if (!signal) return overviewRequest;
  if (signal.aborted) throw new DOMException("Solicitud cancelada", "AbortError");
  return Promise.race([
    overviewRequest,
    new Promise<never>((_, reject) =>
      signal.addEventListener(
        "abort",
        () => reject(new DOMException("Solicitud cancelada", "AbortError")),
        { once: true },
      ),
    ),
  ]);
}

async function fetchLocalOverview() {
  const response = await fetch(`${LOCAL_API}/api/world/overview`);
  if (!response.ok) throw new Error(`El módulo Mundo respondió ${response.status}`);
  return response.json() as Promise<WorldOverview>;
}

function supabaseHeaders(extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...extra,
  } as HeadersInit;
}

async function fetchSupabaseOverview(): Promise<WorldOverview> {
  const categories = await Promise.all(
    REMOTE_CATEGORIES.map(async (category) => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${category.table}?select=source_id`, {
        headers: supabaseHeaders({ Prefer: "count=exact", Range: "0-0" }),
      });
      if (!response.ok) throw new Error(`Supabase respondió ${response.status}`);
      const total = Number(response.headers.get("content-range")?.split("/")[1] ?? 0);
      return { id: category.id, name: category.name, recordCount: total };
    }),
  );
  const recordCount = categories.reduce((total, category) => total + category.recordCount, 0);
  return {
    mode: "supabase-readonly",
    database: "Supabase · Enciclopedia",
    planetCount: 1,
    categoryCount: categories.length,
    recordCount,
    planets: [
      {
        id: 1,
        name: "Archivo remoto",
        imagePath: null,
        favorite: true,
        recordCount,
        categories,
      },
    ],
  };
}

export async function fetchCategoryPage(
  planetId: number,
  categoryId: number,
  options: { query?: string; page?: number; pageSize?: number; signal?: AbortSignal } = {},
): Promise<CategoryPage> {
  const parameters = new URLSearchParams({
    query: options.query ?? "",
    page: String(options.page ?? 1),
    page_size: String(options.pageSize ?? 50),
  });
  const cacheKey = `${planetId}:${categoryId}:${parameters}`;
  const cached = pageCache.get(cacheKey);
  if (cached) return cached;
  if (USE_SUPABASE) {
    const remotePage = await fetchSupabaseCategory(categoryId, options);
    cachePage(cacheKey, remotePage);
    return remotePage;
  }
  const response = await fetch(
    `${LOCAL_API}/api/world/planets/${planetId}/categories/${categoryId}/records?${parameters}`,
    { signal: options.signal },
  );
  if (!response.ok) throw new Error(`No se pudo abrir la categoría (${response.status})`);
  const page = (await response.json()) as CategoryPage;
  cachePage(cacheKey, page);
  return page;
}

function cachePage(key: string, page: CategoryPage) {
  pageCache.set(key, page);
  if (pageCache.size > MAX_CACHED_PAGES) {
    pageCache.delete(pageCache.keys().next().value as string);
  }
}

async function fetchSupabaseCategory(
  categoryId: number,
  options: { query?: string; page?: number; pageSize?: number; signal?: AbortSignal },
): Promise<CategoryPage> {
  const category = REMOTE_CATEGORIES.find((item) => item.id === categoryId);
  if (!category) throw new Error("La categoría remota no existe");
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 50;
  const from = (page - 1) * pageSize;
  const query = options.query?.trim() ?? "";
  const parameters = new URLSearchParams({ select: "*", order: "source_id.asc" });
  if (query) parameters.set(category.titleColumn, `ilike.*${query.replace(/[*,()]/g, " ")}*`);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${category.table}?${parameters}`, {
    signal: options.signal,
    headers: supabaseHeaders({ Prefer: "count=exact", Range: `${from}-${from + pageSize - 1}` }),
  });
  if (!response.ok) throw new Error(`No se pudo consultar Supabase (${response.status})`);
  const records = (await response.json()) as Array<Record<string, unknown>>;
  const total = Number(response.headers.get("content-range")?.split("/")[1] ?? records.length);
  const columns = records[0] ? Object.keys(records[0]) : ["source_id", category.titleColumn];
  return {
    planetId: 1,
    categoryId,
    categoryName: category.name,
    titleColumn: category.titleColumn,
    columns,
    page,
    pageSize,
    hasMore: from + records.length < total,
    query,
    records: records.slice(0, pageSize),
  };
}
