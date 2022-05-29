import { getIssue, getIssueComment, getIssues, updateIssue } from "./issue.ts";
import { path } from "../deps.ts";
import { assertEqualFile } from "../utils/test.ts";
import { assertEquals, assertRejects } from "../deps.ts";
import * as Types from "./graphql/types.ts";

{
  const tests = [
    {
      Filter: undefined,
      wantFile: "want_issue_list.json",
    },
    {
      Filter: "assignee:skanehira",
      wantFile: "want_issue_list_assignee.json",
    },
    {
      Filter: "label:bug",
      wantFile: "want_issue_list_label.json",
    },
  ];

  for (const test of tests) {
    Deno.test({
      name: "get issue list with filter: " + test.Filter,
      fn: async () => {
        const actual = await getIssues(
          {
            cond: {
              owner: "skanehira",
              name: "test",
              Filter: test.Filter,
            },
          },
        );

        const file = path.join(
          "denops",
          "gh",
          "github",
          "testdata",
          test.wantFile,
        );
        await assertEqualFile(file, actual);
      },
    });
  }
}

Deno.test({
  name: "not found issue list",
  fn: async () => {
    const actual = await getIssues(
      {
        cond: {
          owner: "skanehira",
          name: "test",
          Filter: "label:hogehoge",
        },
      },
    );

    assertEquals(actual, []);
  },
});

Deno.test({
  name: "get issue",
  fn: async () => {
    const actual = await getIssue(
      {
        cond: {
          owner: "skanehira",
          repo: "test",
          number: 1,
        },
      },
    );

    const file = path.join(
      "denops",
      "gh",
      "github",
      "testdata",
      "want_issue.json",
    );
    await assertEqualFile(file, actual);
  },
});

Deno.test({
  name: "not found issue",
  fn: async () => {
    await assertRejects(
      () => {
        return getIssue(
          {
            cond: {
              owner: "skanehira",
              repo: "test",
              number: 3,
            },
          },
        );
      },
      Error,
      "not found issue number: 3",
    );
  },
});

Deno.test({
  name: "update issue state",
  fn: async () => {
    const update = (state: Types.IssueState) => {
      return updateIssue({
        input: {
          id: "MDU6SXNzdWU3MDk3MzE0NTA=",
          state: state,
        },
      });
    };
    try {
      const actual = await update(Types.IssueState.Open);
      assertEquals(actual.state, "OPEN");
    } finally {
      await update(Types.IssueState.Closed);
    }
  },
});

Deno.test({
  name: "update issue title",
  fn: async () => {
    const update = (title: string) => {
      return updateIssue({
        input: {
          id: "MDU6SXNzdWU3MDk3MzE0NTA=",
          title: title,
        },
      });
    };
    try {
      const actual = await update("hogehoge");
      assertEquals(actual.title, "hogehoge");
    } finally {
      await update("test1");
    }
  },
});

Deno.test({
  name: "update issue body",
  fn: async () => {
    const update = (body: string) => {
      return updateIssue({
        input: {
          id: "MDU6SXNzdWU3MDk3MzE0NTA=",
          body: body,
        },
      });
    };

    try {
      const actual = await update("please give me a banana");
      assertEquals(actual.body, "please give me a banana");
    } finally {
      await update("# this is test\r\ntest issue");
    }
  },
});

Deno.test({
  name: "update issue assignees",
  fn: async () => {
    const update = (assignees: string[]) => {
      return updateIssue({
        input: {
          id: "MDU6SXNzdWU3MDk3MzE0NTA=",
          assigneeIds: assignees,
        },
      });
    };

    try {
      const actual = await update(["MDQ6VXNlcjc4ODg1OTE="]);
      const expect = {
        nodes: [
          {
            id: "MDQ6VXNlcjc4ODg1OTE=",
            name: "skanehira",
            bio: "Like Vim, Go.\r\nMany CLI/TUI Tools, Vim plugins author.",
            login: "skanehira",
          },
        ],
      };
      assertEquals(actual.assignees, expect);
    } finally {
      await update(["MDQ6VXNlcjc4ODg1OTE=", "MDQ6VXNlcjU3NTc5MTIz"]);
    }
  },
});

Deno.test({
  name: "remove issue assignees",
  fn: async () => {
    const update = (assignees: string[]) => {
      return updateIssue({
        input: {
          id: "MDU6SXNzdWU3MDk3MzE0NTA=",
          assigneeIds: assignees,
        },
      });
    };

    try {
      const actual = await update([]);
      const expect = {
        nodes: [],
      };
      assertEquals(actual.assignees, expect);
    } finally {
      await update(["MDQ6VXNlcjU3NTc5MTIz", "MDQ6VXNlcjc4ODg1OTE="]);
    }
  },
});

Deno.test({
  name: "update issue labels",
  fn: async () => {
    const update = (labels: string[]) => {
      return updateIssue({
        input: {
          id: "MDU6SXNzdWU3MDk3MzE0NTA=",
          labelIds: labels,
        },
      });
    };

    try {
      const actual = await update([
        "MDU6TGFiZWwyMzgwMTEzMTk4",
        "MDU6TGFiZWwyMzgwMTEzMTk5",
      ]);

      const expect = {
        nodes: [
          {
            "name": "bug",
            "color": "d73a4a",
            "description": "Something isn't working",
          },
          {
            "name": "documentation",
            "color": "0075ca",
            "description": "Improvements or additions to documentation",
          },
        ],
      };

      assertEquals(actual.labels, expect);
    } finally {
      await update(["MDU6TGFiZWwyMzgwMTEzMTk5"]);
    }
  },
});

Deno.test({
  name: "remove issue labels",
  fn: async () => {
    const update = (labels: string[]) => {
      return updateIssue({
        input: {
          id: "MDU6SXNzdWU3MDk3MzE0NTA=",
          labelIds: labels,
        },
      });
    };

    try {
      const actual = await update([]);
      const expect = {
        nodes: [],
      };

      assertEquals(actual.labels, expect);
    } finally {
      await update(["MDU6TGFiZWwyMzgwMTEzMTk5"]);
    }
  },
});

Deno.test({
  name: "get comment",
  fn: async () => {
    const actual = await getIssueComment({
      owner: "skanehira",
      repo: "test",
      id: 707713426,
    });

    const file = path.join(
      "denops",
      "gh",
      "github",
      "testdata",
      "want_issue_comment.json",
    );

    await assertEqualFile(file, actual);
  },
});
