import { assertEquals } from "../deps.ts";
import { textDecoder, textEncoder } from "./helper.ts";

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
