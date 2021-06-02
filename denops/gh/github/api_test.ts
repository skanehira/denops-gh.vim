import {
  assertEquals,
  assertThrowsAsync,
} from "https://deno.land/std@0.97.0/testing/asserts.ts";
import { path } from "../deps.ts";
import { yaml } from "../deps.ts";
import { getIssues, getToken } from "./api.ts";
import { fs } from "../deps.ts";

Deno.test("get github token", async () => {
  const home = Deno.env.get("HOME");
  if (!home) {
    throw new Error("$HOME is empty");
  }
  const configPath = await Deno.makeTempFile();

  const config = {
    "github.com": {
      oauth_token: "abcd",
    },
  };

  await Deno.writeTextFile(configPath, yaml.stringify(config));
  try {
    const got = await getToken(configPath);
    assertEquals(got, config["github.com"]["oauth_token"]);
  } finally {
    await Deno.remove(configPath);
  }
});

Deno.test("get config without $HOME", async () => {
  const oldHome = Deno.env.get("HOME") as string;
  await assertThrowsAsync(
    () => {
      Deno.env.delete("HOME");
      return getToken();
    },
    Error,
    "$HOME is empty",
  );
  Deno.env.set("HOME", oldHome);
});

Deno.test("get config with not exists dir", async () => {
  await assertThrowsAsync(
    () => {
      return getToken("tmp");
    },
    Error,
    "cannot find tmp",
  );
});

Deno.test("get config without token", async () => {
  const configPath = await Deno.makeTempFile();
  const config = {
    "github.com": {},
  };
  await Deno.writeTextFile(configPath, yaml.stringify(config));

  await assertThrowsAsync(
    () => {
      return getToken(configPath);
    },
    Error,
    `not found "oauth_token" in ${configPath}`,
  );
  await Deno.remove(configPath);
});

Deno.test("get config without arg", async () => {
  const tmp = await Deno.makeTempDir();
  const oldHome = Deno.env.get("HOME") as string;

  Deno.env.set("HOME", tmp);
  const configPath = path.join(tmp, ".config", "gh", "hosts.yml");
  const config = {
    "github.com": {
      "oauth_token": "aaa",
    },
  };

  await fs.ensureFile(configPath);
  await Deno.writeTextFile(configPath, yaml.stringify(config));

  try {
    const got = await getToken();
    assertEquals(got, config["github.com"]["oauth_token"]);
  } finally {
    await Deno.remove(configPath);
    Deno.env.set("HOME", oldHome);
  }
});

Deno.test("get issues", async () => {
  const issues = await getIssues({
    Owner: "skanehira",
    Name: "gh.vim",
  });

  issues.forEach((issue) => {
    console.dir(issue);
  });
});
