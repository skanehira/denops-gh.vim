import { getIssues, updateIssue } from "./issue.ts";
import { path } from "../deps.ts";
import { assertEqualFile } from "../utils/test.ts";
import { assertEquals } from "../deps.ts";

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

Deno.test({
  name: "update issue",
  fn: async () => {
    try {
      const actual = await updateIssue({
        input: {
          id: "MDU6SXNzdWU3MDk3MzE0NTA=",
          state: "OPEN",
        },
      });

      const file = path.join(
        "denops",
        "gh",
        "github",
        "testdata",
        "want_update_issue_result.json",
      );
      await assertEqualFile(file, actual);
    } finally {
      // restore labels
      await updateIssue({
        input: {
          id: "MDU6SXNzdWU3MDk3MzE0NTA=",
          state: "CLOSED",
        },
      });
    }
  },
});

Deno.test({
  name: "update issue assignees",
  fn: async () => {
    try {
      const actual = await updateIssue({
        input: {
          id: "MDU6SXNzdWU3MzAwMDI3MjE=",
          assignees: ["MDQ6VXNlcjc4ODg1OTE="],
        },
      });

      const expect = {
        nodes: [{
          id: "MDQ6VXNlcjc4ODg1OTE=",
          login: "skanehira",
          name: "skanehira",
          bio: "Like Vim, Go.\r\nMany CLI/TUI Tools, Vim plugin author.",
        }],
      };

      assertEquals(actual.assignees, expect);
    } finally {
      const actual = await updateIssue({
        input: {
          id: "MDU6SXNzdWU3MzAwMDI3MjE=",
          assignees: [],
        },
      });
      assertEquals(actual.assignees, { nodes: [] });
    }
  },
});
