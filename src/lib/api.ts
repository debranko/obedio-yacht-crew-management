const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Auth handled by HTTP-only cookies (server runs 24/7)
  // Browser automatically sends cookie with credentials: "include"
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers || {})
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include", // Sends HTTP-only cookie automatically
  });
  
  // Handle 401 unauthorized - token might be expired
  // Note: Token refresh now handled by backend via HTTP-only cookies
  if (res.status === 401) {
    // Token is in HTTP-only cookie, frontend can't access it
    // Just redirect to login or trigger auth:logout event
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
  
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const result = await res.json();

  // Unwrap apiSuccess response format: { success: true, data: {...} }
  if (result.success && result.data !== undefined) {
    return result.data as T;
  }

  // Handle apiError response format: { success: false, error: "...", code: "..." }
  if (result.success === false) {
    throw new Error(result.error || 'Request failed');
  }

  // Fallback for non-standard responses
  return result as T;
}

export const api = {
  get: <T,>(p: string) => request<T>(p),
  post: <T,>(p: string, body: unknown) => request<T>(p, { method: "POST",  body: JSON.stringify(body) }),
  put: <T,>(p: string, body: unknown) => request<T>(p, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T,>(p: string, body: unknown) => request<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T,>(p: string) => request<T>(p, { method: "DELETE" }),
};
