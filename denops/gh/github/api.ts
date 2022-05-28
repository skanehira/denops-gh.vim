import { getConfig } from "../config.ts";
import { Errors } from "./schema.ts";
import {
  request as graphql_request,
} from "https://deno.land/x/graphql_request@v4.1.0/mod.ts";
import {
  RequestDocument,
  Variables,
} from "https://deno.land/x/graphql_request@v4.1.0/src/types.ts";

export const testEndpoint = "http://localhost:8080";
export const endpoint = Deno.env.get("GITHUB_ENDPOINT") ??
  "https://api.github.com/graphql";

export async function query<T>(
  req: { endpoint?: string; query: string },
): Promise<T> {
  return await post<T>({ endpoint: req.endpoint, body: req.query });
}

export async function mutation<T>(
  req: {
    endpoint?: string;
    input: string;
  },
): Promise<T> {
  const body = `
  mutation {
    ${req.input}
  }
  `;
  return await post<T>({ endpoint: req.endpoint, body: body });
}

// deno-lint-ignore no-explicit-any
export async function request<T = any, V = Variables>(
  url: string,
  query: RequestDocument,
  variables?: V,
): Promise<T> {
  const config = await getConfig();
  const token = config["github.com"].oauth_token;

  if (!url) {
    url = endpoint;
  }
  return await graphql_request<T, V>(url, query, variables, {
    Authorization: `Bearer ${token}`,
  });
}

export async function post<T>(req: {
  endpoint?: string;
  body: string;
}): Promise<T> {
  const config = await getConfig();
  const token = config["github.com"].oauth_token;

  if (!req.endpoint) {
    req.endpoint = endpoint;
  }

  const body = JSON.stringify({ query: req.body });

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
  if (isError(respBody)) {
    const msg = respBody.errors.map((e) => e.message).join("\n");
    throw new Error(msg);
  }
  return respBody as T;
}

function isError(arg: unknown): arg is { errors: Errors } {
  return "errors" in (arg as Record<string, unknown>);
}
