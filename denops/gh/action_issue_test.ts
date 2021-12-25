import { assertEquals, Denops, load, path, test } from "./deps.ts";
import {
  actionEditIssue,
  actionListIssue,
  actionSearchIssues,
} from "./action_issue.ts";
import { buildSchema } from "./buffer.ts";
import {
  assertEqualFile,
  assertEqualTextFile,
  autoloadDir,
  newActionContext,
} from "./utils/test.ts";
import { vimRegister } from "./utils/helper.ts";
import { getActionCtx } from "./action.ts";

test({
  mode: "all",
  name: "action open issue list buffer",
  fn: async (denops: Denops) => {
    const bufname = "gh://skanehira/test/issues";
    const schema = buildSchema(bufname);
    const ctx = { schema: schema, args: { filters: "state:open" } };
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

test({
  mode: "all",
  name: "action yank issue urls",
  fn: async (denops: Denops) => {
    for await (const entry of Deno.readDir(autoloadDir)) {
      if (entry.isFile) {
        await load(denops, path.toFileUrl(path.join(autoloadDir, entry.name)));
      }
    }

    const ctx = newActionContext("gh://skanehira/test/issues");
    await actionListIssue(denops, ctx);
    await denops.call("gh#_action", "issues:yank");
    const got = await denops.call("getreg", vimRegister);
    const want = "https://github.com/skanehira/test/issues/27";
    assertEquals(got, want);
  },
  timeout: 5000,
});

test({
  mode: "all",
  name: "action search issue",
  fn: async (denops: Denops) => {
    const ctx = newActionContext("gh://skanehira/test/issues");
    ctx.args = { filters: "state:closed label:wontfix" };
    await actionSearchIssues(denops, ctx);
    const actual = await getActionCtx(denops);
    const file = path.join(
      "denops",
      "gh",
      "testdata",
      "want_issue_search.json",
    );
    await assertEqualFile(file, actual);
  },
  timeout: 5000,
});
