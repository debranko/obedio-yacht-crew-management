const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Get auth token from localStorage
  const token = localStorage.getItem('obedio-auth-token');
  
  // Build headers with auth token
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(init?.headers || {})
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  
  // Handle 401 unauthorized - token might be expired
  if (res.status === 401) {
    const refreshToken = localStorage.getItem('obedio-auth-token');
    if (refreshToken) {
      try {
        // Try to refresh the token
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data?.token) {
            // Save new token
            localStorage.setItem('obedio-auth-token', refreshData.data.token);
            
            // Retry original request with new token
            const retryHeaders = {
              ...headers,
              Authorization: `Bearer ${refreshData.data.token}`
            };
            
            const retryRes = await fetch(`${BASE_URL}${path}`, {
              ...init,
              headers: retryHeaders,
              credentials: "include",
            });
            
            if (!retryRes.ok) {
              const text = await retryRes.text().catch(() => "");
              throw new Error(text || `HTTP ${retryRes.status}`);
            }
            return retryRes.json() as Promise<T>;
          }
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }
  }
  
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T,>(p: string) => request<T>(p),
  post: <T,>(p: string, body: unknown) => request<T>(p, { method: "POST",  body: JSON.stringify(body) }),
  put: <T,>(p: string, body: unknown) => request<T>(p, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T,>(p: string, body: unknown) => request<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T,>(p: string) => request<T>(p, { method: "DELETE" }),
};
