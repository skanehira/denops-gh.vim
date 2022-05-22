import { assertEquals, assertRejects } from "./deps.ts";
import { yaml } from "./deps.ts";
import { readConfig } from "./config.ts";

Deno.test("get config without HOME", async () => {
  const oldHome = Deno.env.get("HOME") as string;
  await assertRejects(
    () => {
      Deno.env.delete("HOME");
      return readConfig();
    },
    Error,
    "HOME is empty",
  );
  Deno.env.set("HOME", oldHome);
});

Deno.test("get github token", async () => {
  const configPath = await Deno.makeTempFile();

  const config = {
    "github.com": {
      oauth_token: "abcd",
    },
  };

  await Deno.writeTextFile(configPath, yaml.stringify(config));
  try {
    const got = await readConfig(configPath);
    assertEquals(got, config);
  } finally {
    await Deno.remove(configPath);
  }
});

Deno.test("get config with not exists dir", async () => {
  await assertRejects(
    async () => {
      await readConfig("tmp");
    },
    Error,
    "No such file or directory (os error 2)",
  );
});

Deno.test("get config without token", async () => {
  const configPath = await Deno.makeTempFile();
  const config = {
    "github.com": {},
  };
  await Deno.writeTextFile(configPath, yaml.stringify(config));

  await assertRejects(
    async () => {
      await readConfig(configPath);
    },
    Error,
    `not found "oauth_token" in ${configPath}`,
  );
  await Deno.remove(configPath);
});
