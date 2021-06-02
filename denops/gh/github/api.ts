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
