import { Denops, mapping } from "./deps.ts";
export async function map(
  denops: Denops,
  defaultKey: string,
  lhs: string,
  rhs: string,
  options: mapping.MapOptions = {},
): Promise<void> {
  await mapping.map(
    denops,
    lhs,
    rhs,
    options,
  );

  if (defaultKey) {
    await mapping.map(denops, defaultKey, lhs, {
      mode: options.mode,
      buffer: true,
      silent: true,
    });
  }
}
