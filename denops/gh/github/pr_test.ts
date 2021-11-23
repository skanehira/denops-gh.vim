import { assertEquals, assertRejects } from "../deps.ts";
import { getAssociatedPullRequest } from "./pr.ts";

const testEndpoint = "http://localhost:4000";

Deno.test({
  name: "get pr wit commit hash",
  fn: async () => {
    const got = await getAssociatedPullRequest(
      testEndpoint,
      {
        owner: "skanehira",
        name: "getpr",
        commit: "110b584",
      },
    );

    const want = "https://github.com/skanehira/getpr/pull/2";
    assertEquals(want, got);
  },
});

Deno.test({
  name: "not found pr with commit hash",
  fn: async () => {
    await assertRejects(
      async () => {
        await getAssociatedPullRequest(
          testEndpoint,
          {
            owner: "skanehira",
            name: "getpr",
            commit: "2222222",
          },
        );
      },
      Error,
      `not found pull request`,
    );
  },
});
