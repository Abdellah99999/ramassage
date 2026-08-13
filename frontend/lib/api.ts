export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any) {
    super(data?.detail || data?.message || `API Error with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText };
    }
    throw new ApiError(response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  try {
    return await response.json() as T;
  } catch {
    return {} as T;
  }
}

export interface UserProfile {
  id: number;
  nom: string;
  email: string;
  role: string; // 'super_admin' | 'manager' | 'agent'
  agence_id?: number | null;
  actif: boolean;
  agency?: {
    id: number;
    nom: string;
    ville: string;
  } | null;
}

export const authApi = {
  login: async (email: string, password: string) => {
    return apiFetch<{ success: boolean }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async () => {
    return apiFetch<{ success: boolean }>("/api/auth/logout", {
      method: "POST",
    });
  },

  getMe: async (): Promise<UserProfile> => {
    return apiFetch<UserProfile>("/api/auth/me");
  },
};
