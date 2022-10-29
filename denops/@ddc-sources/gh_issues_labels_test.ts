import { Item } from "https://deno.land/x/ddc_vim@v3.0.0/types.ts";
import { LabelBodyFragment } from "../gh/github/graphql/operations.ts";
import { Denops, path, test } from "../gh/deps.ts";
import { getRepoLabels, labelCache } from "./gh_issues_labels.ts";
import { ActionContext } from "../gh/action.ts";
import { assertEqualFile, parseJSON } from "../gh/utils/test.ts";

test({
  mode: "all",
  name: "autocomplete labels from github api",
  fn: async (denops: Denops) => {
    try {
      const ctx: ActionContext = {
        schema: {
          owner: "skanehira",
          repo: "test",
          actionType: "issues:labels",
        },
      };

      const actual = await getRepoLabels(
        denops,
        ctx,
        "bug",
      );

      const file = path.join(
        "denops",
        "@ddc-sources",
        "testdata",
        "want_candidate_label_list.json",
      );

      await assertEqualFile(file, actual);
    } finally {
      labelCache.clear();
    }
  },
});

test({
  mode: "all",
  name: "autocomplete label from cache",
  fn: async (denops: Denops) => {
    try {
      const cache = path.join(
        "denops",
        "@ddc-sources",
        "testdata",
        "cache_candidate_label_list.json",
      );

      const candidates = await parseJSON<Item<LabelBodyFragment>[]>(cache);
      for (const c of candidates) {
        labelCache.set(c.word, c);
      }
      const ctx: ActionContext = {
        schema: {
          owner: "skanehira",
          repo: "test",
          actionType: "issues:labels",
        },
      };

      const actual = await getRepoLabels(
        denops,
        ctx,
        "doc",
      );
      await assertEqualFile(cache, actual);
    } finally {
      labelCache.clear();
    }
  },
});
