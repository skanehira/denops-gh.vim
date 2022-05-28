import { assertEquals, Denops, fs, load } from "../deps.ts";
import { textDecoder, textEncoder } from "./helper.ts";
import { buildSchema } from "../buffer.ts";
import { ActionContext } from "../action.ts";
import { path } from "../deps.ts";

export const autoloadDir = path.join(
  path.dirname(
    path.dirname(path.dirname(path.dirname(path.fromFileUrl(import.meta.url)))),
  ),
  "autoload",
);

export async function loadAutoload(denops: Denops) {
  for await (const entry of Deno.readDir(autoloadDir)) {
    if (entry.isFile) {
      await load(denops, path.toFileUrl(path.join(autoloadDir, entry.name)));
    }
  }
}

export async function parseJSON<T>(file: string): Promise<T> {
  const contents = await Deno.readFile(file);
  const data = JSON.parse(textDecoder.decode(contents)) as T;
  return data;
}

export async function assertEqualFile(
  file: string,
  actual: unknown,
): Promise<void> {
  if (Deno.env.get("UPDATE_GOLDEN")) {
    const contents = JSON.stringify(actual, null, 2);
    await fs.ensureFile(file);
    await Deno.writeFile(file, textEncoder.encode(contents));
    return;
  }
  const contents = await Deno.readFile(file);
  const expected = JSON.parse(textDecoder.decode(contents));
  assertEquals(actual, expected);
}

export async function assertEqualTextFile(
  file: string,
  actual: string,
) {
  if (Deno.env.get("UPDATE_GOLDEN")) {
    await Deno.writeFile(file, textEncoder.encode(actual));
    return;
  }
  const expected = textDecoder.decode(await Deno.readFile(file));
  assertEquals(actual, expected);
}

export function newActionContext(
  bufname: string,
): ActionContext {
  const schema = buildSchema(bufname);
  const ctx: ActionContext = { schema: schema };
  if (schema.actionType == "issues:list") {
    ctx.args = { filters: "state:open" };
  }
  return ctx;
}
