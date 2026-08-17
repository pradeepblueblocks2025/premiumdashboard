const DEFAULT_BASE = "http://localhost:5000";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_BASE;
}
