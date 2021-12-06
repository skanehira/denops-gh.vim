import { assertEquals, Denops, path, test } from "./deps.ts";
import { actionEditIssue, actionListIssue } from "./action_issue.ts";
import { buildSchema } from "./buffer.ts";
import { assertEqualTextFile } from "./utils/test.ts";

test({
  mode: "all",
  name: "action open issue list buffer",
  fn: async (denops: Denops) => {
    const bufname = "gh://skanehira/test/issues";
    const schema = buildSchema(bufname);
    const ctx = { schema: schema };
    await actionListIssue(denops, ctx);
    const actual = await denops.eval(`getline(1, "$")`) as string[];
    const file = path.join(
      "denops",
      "gh",
      "testdata",
      "want_issue_list.txt",
    );
    await assertEqualTextFile(file, actual.join("\n") + "\n");
  },
});

test({
  mode: "all",
  name: "action open edit issue buffer",
  fn: async (denops: Denops) => {
    const bufname = "gh://skanehira/test/issues/1";
    const schema = buildSchema(bufname);
    const ctx = { schema: schema };
    await actionEditIssue(denops, ctx);
    const actual = await denops.eval(`getline(1, "$")`) as string[];
    const want = [
      "# this is test",
      "test issue",
    ];
    assertEquals(actual, want);
  },
});
