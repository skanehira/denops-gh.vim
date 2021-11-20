import { assertEquals } from "../deps.ts";
import { getPRWithCommitHash } from "./pr.ts";

Deno.test({
  name: "get pr wit commit hash",
  fn: async () => {
    const got = await getPRWithCommitHash({
      owner: "skanehira",
      name: "getpr",
      commit: "110b584",
    });

    const want = "https://github.com/skanehira/getpr/pull/2";
    assertEquals(want, got);
  },
});
