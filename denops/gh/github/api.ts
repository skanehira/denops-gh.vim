import { getConfig } from "../config.ts";
import {
  Variables,
} from "https://deno.land/x/graphql_request@v4.1.0/src/types.ts";
import { Octokit } from "../deps.ts";

const config = await getConfig();
const token = config["github.com"].oauth_token;

export const endpoint = Deno.env.get("GITHUB_ENDPOINT") ??
  "https://api.github.com";

export const octokit = new Octokit({
  baseUrl: endpoint,
  auth: token,
});

// deno-lint-ignore no-explicit-any
export async function request<T = any, V = Variables>(
  query: string,
  variables?: V,
): Promise<T> {
  return await octokit.graphql(query, variables);
}
