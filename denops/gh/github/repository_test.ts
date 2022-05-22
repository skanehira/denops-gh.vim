import { assertEquals, path } from "../deps.ts";
import {
  getAssignableUsers,
  getIssueTemplate,
  getLabels,
  getMentionableUsers,
  searchLabels,
} from "./repository.ts";
import { assertEqualFile } from "../utils/test.ts";
import { testEndpoint } from "./api.ts";

Deno.test({
  name: "get mentionable user",
  fn: async () => {
    const actual = await getMentionableUsers(
      {
        endpoint: testEndpoint,
        repo: {
          owner: "skanehira",
          name: "test",
        },
        word: "s",
      },
    );

    const file = path.join(
      "denops",
      "gh",
      "github",
      "testdata",
      "want_mention_user_list.json",
    );
    await assertEqualFile(file, actual);
  },
});

Deno.test({
  name: "not found mentionable user",
  fn: async () => {
    const actual = await getMentionableUsers(
      {
        endpoint: testEndpoint,
        repo: {
          owner: "skanehira",
          name: "test",
        },
        word: "xxxx",
      },
    );

    assertEquals(actual, []);
  },
});

Deno.test({
  name: "get issue templates",
  fn: async () => {
    const actual = await getIssueTemplate({
      endpoint: testEndpoint,
      repo: {
        owner: "skanehira",
        name: "test",
      },
    });

    const file = path.join(
      "denops",
      "gh",
      "github",
      "testdata",
      "want_issue_template.json",
    );
    await assertEqualFile(file, actual);
  },
});

Deno.test({
  name: "get assignable users",
  fn: async () => {
    const actual = await getAssignableUsers({
      endpoint: testEndpoint,
      repo: {
        owner: "skanehira",
        name: "test",
      },
      word: "s",
    });

    const file = path.join(
      "denops",
      "gh",
      "github",
      "testdata",
      "want_assignee_user_list.json",
    );
    await assertEqualFile(file, actual);
  },
});

Deno.test({
  name: "search labels",
  fn: async () => {
    const actual = await searchLabels({
      repo: {
        owner: "skanehira",
        name: "test",
      },
      word: "bug",
    });

    const file = path.join(
      "denops",
      "gh",
      "github",
      "testdata",
      "want_search_label_list.json",
    );
    await assertEqualFile(file, actual);
  },
});

Deno.test({
  name: "get labels",
  fn: async () => {
    const actual = await getLabels({
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
