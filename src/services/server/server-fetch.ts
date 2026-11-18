import { cookies } from "next/headers";
import { baseUrl } from "@/utils/baseUrl";
import type { ApiResponse } from "@/types/api";

interface ServerFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  revalidate?: number | false;
  tags?: string[];
  token?: string;
}

interface ServerFetchResult<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export async function serverFetch<T = unknown>(
  endpoint: string,
  options: ServerFetchOptions = {},
): Promise<ServerFetchResult<T>> {
  const { body, revalidate, tags, token, headers, ...restOptions } = options;

  let authToken = token;
  if (!authToken) {
    try {
      const cookieStore = await cookies();
      authToken = cookieStore.get("lhf-access-token")?.value;
    } catch {
      // In static generation or non-request context, cookies() may fail gracefully
    }
  }

  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  if (body) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (authToken) {
    requestHeaders.set("Authorization", `Bearer ${authToken}`);
  }

  const nextOptions: { revalidate?: number | false; tags?: string[] } = {};
  if (typeof revalidate !== "undefined") nextOptions.revalidate = revalidate;
  if (tags && tags.length > 0) nextOptions.tags = tags;

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      next: Object.keys(nextOptions).length > 0 ? nextOptions : undefined,
    });

    const status = response.status;

    if (!response.ok) {
      let errorMessage = `Request failed with status ${status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Fallback to text status
      }
      return { data: null, error: errorMessage, status };
    }

    const json = (await response.json()) as ApiResponse<T> | T;
    // Handle both wrapped { success, data } responses and direct responses
    const data = (json && typeof json === "object" && "data" in json ? json.data : json) as T;

    return { data, error: null, status };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Network error";
    return { data: null, error: errorMsg, status: 500 };
  }
}
