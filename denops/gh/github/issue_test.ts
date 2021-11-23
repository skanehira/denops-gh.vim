import { getIssues } from "./issue.ts";
import { assertEquals } from "../deps.ts";

Deno.test({
  name: "get issues",
  fn: async () => {
    const got = await getIssues(
      "http://localhost:4000",
      {
        owner: "skanehira",
        name: "gh.vim",
      },
    );

    const want = {
      nodes: [
        {
          title: "Add feature of quote reply",
          author: {
            login: "skanehira",
          },
          assignees: {
            nodes: [],
          },
          body: "# test body\nHello World",
          labels: {
            nodes: [
              {
                name: "enhancement",
                color: "a2eeef",
              },
              {
                name: "help wanted",
                color: "008672",
              },
            ],
          },
          closed: false,
          number: 121,
          url: "https://github.com/skanehira/gh.vim/issues/121",
          state: "OPEN",
          repository: {
            name: "gh.vim",
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        startCursor: "Y3Vyc29yOjE=",
        endCursor: "Y3Vyc29yOjEw",
      },
    };

    assertEquals(want, got);
  },
});
