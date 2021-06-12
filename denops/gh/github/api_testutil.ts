import { server } from "../deps.ts";
import { buildSchema, graphql } from "https://cdn.skypack.dev/graphql";
import { readAll } from "https://deno.land/std@0.98.0/io/mod.ts";
import { fromFileUrl } from "https://deno.land/std@0.98.0/path/mod.ts";

function pathResolver(meta: ImportMeta): (p: string) => string {
  return (p) => fromFileUrl(new URL(p, meta.url));
}

const resolve = pathResolver(import.meta);

const schema = buildSchema(
  await Deno.readTextFile(resolve("./schema.docs.graphql")),
);

const run = async (sv: server.Server, resolvers: unknown) => {
  for await (const req of sv) {
    const buf = await readAll(req.body);
    const body = JSON.parse(new TextDecoder().decode(buf));
    const res = await graphql(schema, body.query, resolvers);
    req.respond({ body: JSON.stringify(res) });
  }
};

export const testAPIWithMock = async (
  f: (endpoint: string) => Promise<void>,
  resolvers: unknown,
) => {
  const sv = server.serve({ port: 9999 });
  run(sv, resolvers);
  try {
    await f("http://localhost:9999");
  } catch (e) {
    throw e;
  } finally {
    sv.close();
  }
};
