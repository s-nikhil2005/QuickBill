const API_BASE = "/api/v1";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
  [key: string]: any;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  businessId?: number | null
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (businessId) {
    headers["x-business-id"] = businessId.toString();
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // for JWT cookies
    });

    const data = await res.json();

    if (!res.ok) {
      throw {
        statusCode: res.status,
        message: data.message || "An error occurred with the request.",
        code: data.code || "REQUEST_FAILED",
        ...data,
      };
    }

    return data;
  } catch (err: any) {
    if (err.statusCode) throw err;
    throw {
      statusCode: 500,
      message: err.message || "Network error. Please check your connection.",
      code: "NETWORK_ERROR",
    };
  }
}
