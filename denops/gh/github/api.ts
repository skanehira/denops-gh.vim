import { getConfig } from "../config.ts";

export const endpoint = "https://api.github.com/graphql";

export async function query<T>(
  req: { endpoint?: string; query: unknown },
): Promise<T> {
  const config = await getConfig();
  const token = config["github.com"].oauth_token;

  if (!req.endpoint) {
    req.endpoint = endpoint;
  }

  const body = JSON.stringify({ query: req.query });

  const resp = await fetch(req.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: body,
  });

  const respBody = await resp.json();
  return respBody as T;
}
