import { path, yaml } from "./deps.ts";
import { onece } from "./utils/helper.ts";

export interface GitHubConfig {
  [key: string]: {
    oauth_token: string;
    user: string;
  };
}

const isWindows = Deno.build.os === "windows";

export async function readConfig(configPath?: string): Promise<GitHubConfig> {
  if (!configPath) {
    const key = isWindows ? "APPDATA" : "HOME";
    const home = Deno.env.get(key);
    if (!home) {
      throw new Error(`${key} is empty`);
    }
    if (isWindows) {
      configPath = path.join(home, "GitHub CLI", "hosts.yml");
    } else {
      configPath = path.join(home, ".config", "gh", "hosts.yml");
    }
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
