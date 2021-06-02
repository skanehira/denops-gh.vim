import { path } from "../deps.ts";
import { fs } from "../deps.ts";
import { yaml } from "../deps.ts";

export interface GitHubConfig {
  [key: string]: {
    oauth_token: string;
    git_protocol: string;
    user: string;
  };
}

export async function getToken(configPath?: string): Promise<string> {
  if (!configPath) {
    const home = Deno.env.get("HOME");
    if (!home) {
      throw new Error("$HOME is empty");
    }
    configPath = path.join(home, ".config", "gh", "hosts.yml");
  }

  // TODO support windows
  if (Deno.build.os == "windows") {
    throw new Error("Unspported windows");
  }

  if (!await fs.exists(configPath)) {
    throw new Error(`cannot find ${configPath}`);
  }

  const contents = await Deno.readTextFile(configPath);
  const config = yaml.parse(contents) as GitHubConfig;

  if (config["github.com"]["oauth_token"]) {
    return config["github.com"]["oauth_token"];
  }

  throw new Error(
    `not found "oauth_token" in ${configPath}`,
  );
}

export const once = <A extends unknown, R extends Promise<string>>(
  f: (arg?: A) => R,
) => {
  let v: R | undefined;
  return (arg?: A): R => {
    return v || (v = f(arg));
  };
};

const fetchToken = once(async (path?: string) => {
  return await getToken(path);
});

const endpoint = "https://api.github.com/graphql";

export interface Repository {
  Name: string;
  Owner: string;
}

export interface Issue {
  ID: number;
  Title: string;
  State: string;
}

export async function getIssues(repo: Repository): Promise<Issue[]> {
  const token = await fetchToken();
  const query = `
  {
    repository(owner: "${repo.Owner}", name: "${repo.Name}") {
      issues(first: 100, states: [OPEN]) {
        nodes{
          id
          title
          state
        }
      }
    }
  }
  `;

  const body = JSON.stringify({ query: query });

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: body,
  });

  const json = await resp.json();
  return json.data.repository.issues.nodes;
}
