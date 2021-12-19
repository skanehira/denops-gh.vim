import { path } from "../deps.ts";
import { getMentionableUsers } from "./repository.ts";
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
