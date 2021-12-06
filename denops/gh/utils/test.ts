import { assertEquals } from "../deps.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export async function assertEqualFile(
  file: string,
  actual: unknown,
): Promise<void> {
  if (Deno.env.get("UPDATE_GOLDEN")) {
    const contents = JSON.stringify(actual, null, 2);
    await Deno.writeFile(file, encoder.encode(contents));
    return;
  }
  const contents = await Deno.readFile(file);
  const expected = JSON.parse(decoder.decode(contents));
  assertEquals(actual, expected);
}

export async function assertEqualTextFile(
  file: string,
  actual: string,
) {
  if (Deno.env.get("UPDATE_GOLDEN")) {
    await Deno.writeFile(file, encoder.encode(actual));
    return;
  }
  const expected = decoder.decode(await Deno.readFile(file));
  assertEquals(actual, expected);
}
