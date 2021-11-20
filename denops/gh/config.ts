import { path, yaml } from "./deps.ts";
import { onece } from "./utils/helper.ts";

export interface GitHubConfig {
  [key: string]: {
    oauth_token: string;
    user: string;
  };
}

export async function readConfig(configPath?: string): Promise<GitHubConfig> {
  // TODO support windows
  if (Deno.build.os == "windows") {
    throw new Error("Unspported windows");
  }

  if (!configPath) {
    const home = Deno.env.get("HOME");
    if (!home) {
      throw new Error("$HOME is empty");
    }
    configPath = path.join(home, ".config", "gh", "hosts.yml");
  }

  const contents = await Deno.readTextFile(configPath);
  if (!contents) {
    throw new Error(
      `not found "oauth_token" in ${configPath}`,
    );
  }
  const config = yaml.parse(contents) as GitHubConfig;
  if (!config["github.com"].oauth_token) {
    throw new Error(`not found "oauth_token" in ${configPath}`);
  }
  return config;
}

export const getConfig = onece(async (path?: string) => {
  return await readConfig(path);
});
