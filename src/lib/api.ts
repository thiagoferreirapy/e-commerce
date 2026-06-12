/**
 * Cliente HTTP único para a API TORQUE. Funciona no servidor (Server
 * Components) e no cliente. No cliente, anexa o token JWT salvo pelo auth store
 * (lido direto do localStorage para evitar dependência circular com o store).
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("torque-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Anexa o token mesmo que opcional (padrão: anexa se existir). */
  auth?: boolean;
  /** Cache do fetch (Server Components). Padrão: no-store (dados dinâmicos). */
  cache?: RequestCache;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, cache = "no-store" } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache,
    // Envia/recebe o cookie de sessão httpOnly (auth segura contra XSS).
    credentials: "include",
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data as { error?: { message?: string } } | null)?.error?.message ??
      "Não foi possível completar a requisição.";
    throw new Error(message);
  }
  return data as T;
}

/** Monta querystring a partir de um objeto (arrays viram CSV; ignora vazios). */
export function toQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length) sp.set(key, value.join(","));
    } else {
      sp.set(key, String(value));
    }
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}
