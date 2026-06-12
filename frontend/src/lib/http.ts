/** Tiny typed HTTP client. All API access goes through here so error
 *  handling (incl. FastAPI validation-error flattening) lives in one place. */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface FastApiValidationIssue {
  loc?: (string | number)[];
  msg: string;
}

function flattenDetail(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return (detail as FastApiValidationIssue[])
      .map((issue) => {
        const field = (issue.loc ?? []).slice(1).join(".");
        return field ? `${field}: ${issue.msg}` : issue.msg;
      })
      .join(" · ");
  }
  return fallback;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let message = res.statusText || `HTTP ${res.status}`;
    try {
      const body: unknown = await res.json();
      if (body && typeof body === "object" && "detail" in body) {
        message = flattenDetail((body as { detail: unknown }).detail, message);
      }
    } catch {
      /* non-JSON error body — keep the status text */
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const http = {
  get: <T>(url: string) => request<T>(url),

  post: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  postForm: <T>(url: string, form: FormData) =>
    request<T>(url, { method: "POST", body: form }),

  patch: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  delete: (url: string) => request<void>(url, { method: "DELETE" }),
};

/** Human-readable message from any thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
