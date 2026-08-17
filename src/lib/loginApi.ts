import { getApiBaseUrl } from "./apiConfig";
import { setStoredToken } from "./auth";

export interface LoginResponse {
  status?: boolean;
  message?: string;
  token?: string;
  data?: {
    customerId?: string;
    firstName?: string;
    lastName?: string;
    emailAddress?: string;
  };
}

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  const json = (await response.json()) as LoginResponse & {
    message?: string;
  };

  if (!response.ok || !json.token) {
    throw new Error(json.message || "Invalid email or password");
  }

  setStoredToken(json.token);
  return json;
}
