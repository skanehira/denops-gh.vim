import { path } from "../deps.ts";
import { getLabels, getMentionableUsers } from "./repository.ts";
import { assertEqualFile } from "../utils/test.ts";

Deno.test({
  name: "get mentionable user",
  fn: async () => {
    const actual = await getMentionableUsers(
      {
        repo: {
          owner: "skanehira",
          name: "gh.vim",
        },
        word: "s",
      },
    );

    const file = path.join(
      "denops",
      "gh",
      "github",
      "testdata",
      "want_user_list.json",
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
      labels: ["bug", "good first issue"],
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
