import { assertEquals, Denops, test } from "./deps.ts";
import { actionListIssue } from "./action_issue.ts";
import { defaults } from "./action.ts";
import { buildSchema } from "./buffer.ts";

test({
  mode: "all",
  name: "action open issue list buffer",
  fn: async (denops: Denops) => {
    const old = defaults.endpoint;
    defaults.endpoint = "http://localhost:4000";
    const bufname = "gh://skanehira/test/issues";
    const schema = buildSchema(bufname);
    const ctx = { schema: schema };
    await actionListIssue(denops, ctx);
    defaults.endpoint = old;
    const actual = await denops.eval(`getline(1, "$")`) as string[];
    const want = [
      "#124 Allow autoselect owner and project of current directory(git repo) CLOSED @korney4eg @skanehira (enhancement) ",
    ];
    assertEquals(actual, want);
  },
});
