import { assertEquals, assertRejects } from "../deps.ts";
import { getAssociatedPullRequest } from "./pr.ts";

Deno.test({
  name: "get pr wit commit hash",
  fn: async () => {
    const got = await getAssociatedPullRequest(
      {
        cond: {
          owner: "skanehira",
          name: "test",
          commit: "73d1398",
        },
      },
    );

    const want = "https://github.com/skanehira/test/pull/48";
    assertEquals(want, got);
  },
});

Deno.test({
  name: "not found pr with commit hash",
  fn: async () => {
    await assertRejects(
      async () => {
        await getAssociatedPullRequest(
          {
            cond: {
              owner: "skanehira",
              name: "test",
              commit: "2222222",
            },
          },
        );
      },
      Error,
      `not found pull request`,
    );
  },
});
