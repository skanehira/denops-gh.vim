import { getIssues } from "./api_issue.ts";
import { testAPIWithMock } from "./api_testutil.ts";
import { assertEquals } from "https://deno.land/std@0.97.0/testing/asserts.ts";
import { Issue } from "./schema.ts";

Deno.test("get issues form api", async () => {
  const resolvers = {
    search: () => {
      return {
        nodes: [{
          __typename: "Issue",
          title: "hello",
        }] as Issue[],
      };
    },
  };

  await testAPIWithMock(async (endpoint: string) => {
    const issues = await getIssues(endpoint, { Owner: "test", Name: "test" });
    assertEquals(issues, [{ title: "hello" }]);
  }, resolvers);
});
