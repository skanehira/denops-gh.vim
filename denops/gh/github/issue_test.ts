import { getIssues } from "./issue.ts";
import { path } from "../deps.ts";
import { assertEqualFile } from "../utils/test.ts";

Deno.test({
  name: "get issues",
  fn: async () => {
    const actual = await getIssues(
      {
        cond: {
          owner: "skanehira",
          name: "test",
        },
      },
    );

    const file = path.join(
      "denops",
      "gh",
      "github",
      "testdata",
      "want_issue_list.json",
    );
    await assertEqualFile(file, actual);
  },
});
