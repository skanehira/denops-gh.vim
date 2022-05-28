import { assertEquals, path } from "../deps.ts";
import {
  getAssignableUsers,
  getIssueTemplate,
  getLabels,
  getMentionableUsers,
  searchLabels,
} from "./repository.ts";
import { assertEqualFile, parseJSON } from "../utils/test.ts";
import { testEndpoint } from "./api.ts";

Deno.test({
  name: "get mentionable users",
  fn: async (t) => {
    const file = path.join(
      "denops",
      "gh",
      "github",
      "testdata",
      "want_mention_user_list.json",
    );

    const tests = [
      {
        name: "exsits users",
        args: {
          owner: "skanehira",
          name: "test",
          word: "s",
        },
        expect: await parseJSON(file),
      },
      {
        name: "not exsits user",
        args: {
          owner: "skanehira",
          name: "test",
          word: "notfound",
        },
        expect: [],
      },
      {
        name: "not exsits repository",
        args: {
          owner: "skanehira",
          name: "notfound",
          word: "s",
        },
        expect: [],
      },
    ];

    for (const test of tests) {
      await t.step(test.name, async () => {
        const actual = await getMentionableUsers(
          {
            endpoint: testEndpoint,
            repo: {
              owner: test.args.owner,
              name: test.args.name,
            },
            word: test.args.word,
          },
        );

        assertEquals(actual, test.expect);
      });
    }
  },
});

Deno.test({
  name: "get issue templates",
  fn: async (t) => {
    const file = path.join(
      "denops",
      "gh",
      "github",
      "testdata",
      "want_issue_template.json",
    );

    const tests = [
      {
        name: "exsits templates",
        args: {
          owner: "skanehira",
          name: "test",
        },
        expect: await parseJSON(file),
      },
      {
        name: "not exists templates",
        args: {
          owner: "skanehira",
          name: "notfound",
        },
        expect: [],
      },
      {
        name: "empty issue templates",
        args: {
          owner: "skanehira",
          name: "emptyIssuTemplate",
        },
        expect: [],
      },
    ];

    for (const test of tests) {
      await t.step(test.name, async () => {
        const actual = await getIssueTemplate({
          endpoint: testEndpoint,
          repo: {
            owner: test.args.owner,
            name: test.args.name,
          },
        });
        assertEquals(actual, test.expect);
      });
    }
  },
});

Deno.test({
  name: "get assignable users",
  fn: async (t) => {
    const get = (word: string) => {
      return getAssignableUsers({
        endpoint: testEndpoint,
        repo: {
          owner: "skanehira",
          name: "test",
        },
        word: word,
      });
    };

    const file = path.join(
      "denops",
      "gh",
      "github",
      "testdata",
      "want_assignee_user_list.json",
    );

    const tests = [
      {
        name: "found users",
        word: "s",
        expect: await parseJSON(file),
      },
      {
        name: "not found users",
        word: "notfound",
        expect: [],
      },
    ];

    for (const test of tests) {
      await t.step(test.name, async () => {
        const actual = await get(test.word);
        assertEquals(actual, test.expect);
      });
    }
  },
});

Deno.test({
  name: "search labels",
  fn: async (t) => {
    const get = (word: string) => {
      return searchLabels({
        endpoint: testEndpoint,
        repo: {
          owner: "skanehira",
          name: "test",
        },
        word: word,
      });
    };

    const file = path.join(
      "denops",
      "gh",
      "github",
      "testdata",
      "want_search_label_list.json",
    );

    const tests = [
      {
        name: "exists labels",
        word: "bug",
        expect: await parseJSON(file),
      },
      {
        name: "not found labels",
        word: "notfound",
        expect: [],
      },
    ];

    for (const test of tests) {
      await t.step(test.name, async () => {
        const actual = await get(test.word);
        assertEquals(actual, test.expect);
      });
    }
  },
});

Deno.test({
  name: "get labels",
  fn: async () => {
    const actual = await getLabels({
      endpoint: testEndpoint,
      repo: {
        owner: "skanehira",
        name: "test",
      },
      labels: ["bug", "documentation"],
    });

    const file = path.join(
      "denops",
      "gh",
      "github",
      "testdata",
      "want_get_label_list.json",
    );
    await assertEqualFile(file, actual);
  },
});
