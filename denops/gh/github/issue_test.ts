import { getIssue, getIssues, updateIssue } from "./issue.ts";
import { path } from "../deps.ts";
import { testEndpoint } from "./api.ts";
import { assertEqualFile } from "../utils/test.ts";
import { assertEquals, assertRejects } from "../deps.ts";

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
            endpoint: testEndpoint,
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
        endpoint: testEndpoint,
        cond: {
          owner: "skanehira",
          name: "test",
          Filter: "label:hogehoge",
        },
      },
    );

    const expect = {
      nodes: [],
      pageInfo: {
        endCursor: "Y3Vyc29yOjI=",
        hasNextPage: false,
        startCursor: "Y3Vyc29yOjE=",
      },
    };
    assertEquals(actual, expect);
  },
});

Deno.test({
  name: "get issue",
  fn: async () => {
    const actual = await getIssue(
      {
        endpoint: testEndpoint,
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
            endpoint: testEndpoint,
            cond: {
              owner: "skanehira",
              repo: "test",
              number: 2,
            },
          },
        );
      },
      Error,
      "not found issue number: 2",
    );
  },
});

Deno.test({
  name: "update issue state",
  fn: async () => {
    const actual = await updateIssue({
      endpoint: testEndpoint,
      input: {
        id: "MDU6SXNzdWU3MDk3MzE0NTA=",
        state: "OPEN",
      },
    });

    assertEquals(actual.state, "OPEN");
  },
});

Deno.test({
  name: "update issue title",
  fn: async () => {
    const actual = await updateIssue({
      endpoint: testEndpoint,
      input: {
        id: "MDU6SXNzdWU3MDk3MzE0NTA=",
        title: "hogehoge",
      },
    });

    assertEquals(actual.title, "hogehoge");
  },
});

Deno.test({
  name: "update issue body",
  fn: async () => {
    const actual = await updateIssue({
      endpoint: testEndpoint,
      input: {
        id: "MDU6SXNzdWU3MDk3MzE0NTA=",
        body: "please give me a banana",
      },
    });

    assertEquals(actual.body, "please give me a banana");
  },
});

Deno.test({
  name: "update issue assignees",
  fn: async () => {
    const actual = await updateIssue({
      endpoint: testEndpoint,
      input: {
        id: "MDU6SXNzdWU3MDk3MzE0NTA=",
        assignees: [
          "MDQ6VXNlcjc4ODg1OTE=",
        ],
      },
    });

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
  },
});

Deno.test({
  name: "remove issue assignees",
  fn: async () => {
    const actual = await updateIssue({
      endpoint: testEndpoint,
      input: {
        id: "MDU6SXNzdWU3MDk3MzE0NTA=",
        assignees: [],
      },
    });

    const expect = {
      nodes: [],
    };

    assertEquals(actual.assignees, expect);
  },
});

Deno.test({
  name: "update issue labels",
  fn: async () => {
    const actual = await updateIssue({
      endpoint: testEndpoint,
      input: {
        id: "MDU6SXNzdWU3MDk3MzE0NTA=",
        labels: [
          "MDU6TGFiZWwyMzgwMTEzMTk4",
          "MDU6TGFiZWwyMzgwMTEzMTk5",
        ],
      },
    });

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
  },
});

Deno.test({
  name: "remove issue labels",
  fn: async () => {
    const actual = await updateIssue({
      endpoint: testEndpoint,
      input: {
        id: "MDU6SXNzdWU3MDk3MzE0NTA=",
        labels: [],
      },
    });

    const expect = {
      nodes: [],
    };

    assertEquals(actual.labels, expect);
  },
});
