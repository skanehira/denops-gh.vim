import { assertEquals, delay, Denops, path, test } from "./deps.ts";
import {
  actionCloseIssue,
  actionEditIssue,
  actionListAssignees,
  actionListIssue,
  actionListLabels,
  actionOpenIssue,
  actionSearchIssues,
  actionUpdateAssignees,
  actionUpdateIssue,
  actionUpdateLabels,
} from "./action_issue.ts";
import { buildSchema } from "./buffer.ts";
import {
  assertEqualFile,
  assertEqualTextFile,
  loadAutoload,
  newActionContext,
} from "./utils/test.ts";
import { vimRegister } from "./utils/helper.ts";
import { getIssue } from "./github/issue.ts";
import { main } from "./main.ts";

test({
  mode: "all",
  name: "action open issue list buffer",
  fn: async (denops: Denops) => {
    const bufname = "gh://skanehira/test/issues";
    const schema = buildSchema(bufname);
    const ctx = {
      schema: schema,
      args: { filters: "state:open state:closed" },
    };
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
  timeout: 3000,
});

test({
  mode: "all",
  name: "action edit and update issue buffer",
  fn: async (denops: Denops) => {
    const bufname = "gh://skanehira/test/issues/1";
    const schema = buildSchema(bufname);
    const ctx = { schema: schema };
    await actionEditIssue(denops, ctx);
    const actual = await denops.call("getline", 1, "$") as string[];
    const issueBody = [
      "# this is test",
      "test issue",
    ];
    assertEquals(actual, issueBody);

    try {
      const newIssueBody = ["hello", "world"];
      await denops.call("setline", 1, newIssueBody);
      await actionUpdateIssue(denops, ctx);

      const newIssue = await getIssue({
        cond: {
          owner: schema.owner,
          repo: schema.repo,
          number: 1,
        },
      });

      assertEquals(newIssue.body.split("\n"), newIssueBody);
    } finally {
      await denops.call("setline", 1, issueBody);
      await actionUpdateIssue(denops, ctx);
    }
  },
  timeout: 3000,
});

test({
  mode: "all",
  name: "action yank issue urls",
  fn: async (denops: Denops) => {
    await loadAutoload(denops);

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
    ctx.args = { filters: "state:closed label:bug" };
    await actionSearchIssues(denops, ctx);
    const actual = await denops.call("getline", 1, "$");
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

test({
  mode: "all",
  name: "change issue state",
  fn: async (denops: Denops) => {
    const ctx = newActionContext("gh://skanehira/test/issues");
    ctx.args = { filters: "" };

    await loadAutoload(denops);
    await actionSearchIssues(denops, ctx);
    const current = await denops.call("getline", 1);
    assertEquals(
      current,
      "#27 test2  OPEN              ()                  ",
    );

    await actionCloseIssue(denops, ctx);
    const actual = await denops.call("getline", 1, "$");

    const dir = path.join(
      "denops",
      "gh",
      "testdata",
    );
    await assertEqualFile(
      path.join(
        dir,
        "want_issue_state_open.json",
      ),
      actual,
    );

    await actionOpenIssue(denops, ctx);

    await assertEqualFile(
      path.join(
        dir,
        "want_issue_state_close.json",
      ),
      actual,
    );
  },
});

test({
  mode: "all",
  name: "update assignees",
  fn: async (denops: Denops) => {
    const ctx = newActionContext("gh://skanehira/test/issues/1");
    try {
      await actionListAssignees(denops, ctx);
      await denops.cmd("%d_");
      await denops.call("setline", 1, ["skanehira"]);
      await actionUpdateAssignees(denops, ctx);

      await denops.cmd("bw!");

      await actionListAssignees(denops, ctx);
      assertEquals(await denops.call("getline", 1, "$"), ["skanehira"]);
    } finally {
      await denops.cmd("%d_");
      await denops.call("setline", 1, ["skanehira", "gorilla"]);
      await actionUpdateAssignees(denops, ctx);
    }
  },
});

test({
  mode: "all",
  name: "update label",
  fn: async (denops: Denops) => {
    const ctx = newActionContext("gh://skanehira/test/issues/1");
    try {
      await actionListLabels(denops, ctx);
      await denops.cmd("%d_");
      await denops.call("setline", 1, ["bug"]);
      await actionUpdateLabels(denops, ctx);

      await denops.cmd("bw!");
      await actionListLabels(denops, ctx);
      assertEquals(await denops.call("getline", 1, "$"), ["bug"]);
    } finally {
      await denops.cmd("%d_");
      await denops.call("setline", 1, ["documentation"]);
      await actionUpdateLabels(denops, ctx);
    }
  },
});

test({
  mode: "nvim",
  name: "open assignee buffer from issue list",
  fn: async (denops: Denops) => {
    await main(denops);
    await loadAutoload(denops);
    const ctx = newActionContext("gh://skanehira/test/issues");
    ctx.args = { filters: "state:closed" };
    await actionListIssue(denops, ctx);
    await denops.call("feedkeys", "ghan");
    await delay(300);
    assertEquals(await denops.call("getline", 1, "$"), ["skanehira"]);
  },
  timeout: 5000,
});

test({
  mode: "nvim",
  name: "open label buffer from issue list",
  fn: async (denops: Denops) => {
    await main(denops);
    await loadAutoload(denops);
    const ctx = newActionContext("gh://skanehira/test/issues");
    ctx.args = { filters: "state:closed" };
    await actionListIssue(denops, ctx);
    await denops.call("feedkeys", "ghln");
    await delay(300);
    assertEquals(await denops.call("getline", 1, "$"), ["bug", "duplicate"]);
  },
  timeout: 5000,
});
